import os
import re
import subprocess

def git(args, fail_on_error=True):
    result = subprocess.run(["git"] + args, stdout=subprocess.PIPE, text=True, check=fail_on_error)
    if result.returncode != 0:
        return None
    return result.stdout.strip()

def main():
    try:
        tag = git(["describe", "--tags", "--match", "v*-rc*", "--abbrev=0"], fail_on_error=False)

        if not tag:
            print("No existing RC tags found. Handing control to release-please.")
            return

        raw_commits = git(["log", f"{tag}..HEAD", "--pretty=format:%s"])
        if not raw_commits:
            print("No commits found.")
            return
            
        commit_list = raw_commits.split('\n')
        
        # FILTER: Ignore bot commits
        real_commits = [
            c for c in commit_list 
            if "Release-As:" not in c and "chore: enforce correct rc version" not in c
        ]
        
        commit_count = len(real_commits)
        
        if commit_count == 0:
            print("No user commits found (only bot commits). Exiting.")
            return

        logs = git(["log", f"{tag}..HEAD", "--pretty=format:%B"])

        m = re.match(r"^v(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$", tag)
        if not m: return
        
        major, minor, patch, rc = int(m[1]), int(m[2]), int(m[3]), int(m[4])

        breaking_regex = r"^(feat|fix|refactor)(\(.*\))?!:"
        is_breaking = re.search(breaking_regex, logs, re.MULTILINE) or "BREAKING CHANGE" in logs
        is_feat = re.search(r"^feat(\(.*\))?:", logs, re.MULTILINE)

        next_ver = ""

        if is_breaking:
            next_ver = f"{major + 1}.0.0-rc.{commit_count}"

        elif is_feat:
            if patch > 0:
                next_ver = f"{major}.{minor + 1}.0-rc.{commit_count}"
            else:
                next_ver = f"{major}.{minor}.{patch}-rc.{rc + commit_count}"
        
        else:
            next_ver = f"{major}.{minor}.{patch}-rc.{rc + commit_count}"

        print(f"Base Tag: {tag}")
        print(f"Real Commits: {commit_count}")
        print(f"Next Version: {next_ver}")
        
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"next_version={next_ver}\n")
            
    except Exception as e:
        print(f"Error: {e}")
        pass

if __name__ == "__main__":
    main()
