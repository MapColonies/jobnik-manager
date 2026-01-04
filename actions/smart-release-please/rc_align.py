#!/usr/bin/env python3
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
        # 1. Find the latest RC tag (The Baseline)
        tag = git(["describe", "--tags", "--match", "v*-rc*", "--abbrev=0"], fail_on_error=False)

        if not tag:
            print("No existing RC tags found. Handing control to release-please.")
            return

        # 2. Count commits since that tag
        commit_count_str = git(["rev-list", "--count", f"{tag}..HEAD"])
        if not commit_count_str: return
        commit_count = int(commit_count_str)
        
        if commit_count == 0:
            print("No new commits. Exiting.")
            return

        # 3. Get Logs
        logs = git(["log", f"{tag}..HEAD", "--pretty=format:%B"])

        # 4. Parse Current Version
        m = re.match(r"^v(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$", tag)
        if not m: return
        
        major, minor, patch, rc = int(m[1]), int(m[2]), int(m[3]), int(m[4])

        # 5. Analyze Commits
        breaking_regex = r"^(feat|fix|refactor)(\(.*\))?!:"
        is_breaking = re.search(breaking_regex, logs, re.MULTILINE) or "BREAKING CHANGE" in logs
        is_feat = re.search(r"^feat(\(.*\))?:", logs, re.MULTILINE)

        next_ver = ""
        
        # --- HYBRID LOGIC START ---

        if is_breaking:
            # Major Jump -> Always RESET to rc.1
            if major == 0:
                next_ver = f"{major}.{minor + 1}.0-rc.1"
            else:
                next_ver = f"{major + 1}.0.0-rc.1"

        elif is_feat:
            if patch > 0:
                # Patch exists (0.1.1) so Feat triggers Minor Jump -> RESET to rc.1
                next_ver = f"{major}.{minor + 1}.0-rc.1"
            else:
                # Already on Minor (0.2.0) -> Accumulate RC
                next_ver = f"{major}.{minor}.{patch}-rc.{rc + commit_count}"
        
        else:
            # Fixes/Chores -> Accumulate RC
            next_ver = f"{major}.{minor}.{patch}-rc.{rc + commit_count}"

        # --- HYBRID LOGIC END ---
        
        print(f"Base Tag: {tag}")
        print(f"Commits since: {commit_count}")
        print(f"Next Version: {next_ver}")
        
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"next_version={next_ver}\n")
            
    except Exception as e:
        print(f"Error: {e}")
        pass

if __name__ == "__main__":
    main()
