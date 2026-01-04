#!/usr/bin/env python3
import os
import re
import subprocess

def git(args, fail_on_error=True):
    # We add fail_on_error=False to handle cases where no tags exist
    result = subprocess.run(["git"] + args, stdout=subprocess.PIPE, text=True, check=fail_on_error)
    if result.returncode != 0:
        return None
    return result.stdout.strip()

def main():
    try:
        # 1. Try to find the latest RC tag
        # check=False ensures we don't crash if no tags are found
        tag = git(["describe", "--tags", "--match", "v*-rc*", "--abbrev=0"], fail_on_error=False)

        if not tag:
            print("No existing RC tags found. Skipping manual alignment.")
            print("Handing control to native release-please behavior.")
            # We exit successfully (0) but write nothing to next_version.
            # This skips the "Inject Footer" step in your action.yaml.
            return

        # 2. Get logs since that tag
        logs = git(["log", f"{tag}..HEAD", "--pretty=format:%B"])
        if not logs: return

        # 3. Parse Current Version
        m = re.match(r"^v(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$", tag)
        if not m:
            print(f"Tag {tag} does not match RC pattern.")
            return
        
        major, minor, patch, rc = int(m[1]), int(m[2]), int(m[3]), int(m[4])

        # 4. Analyze Commits (Standard Logic)
        breaking_regex = r"^(feat|fix|refactor)(\(.*\))?!:"
        is_breaking = re.search(breaking_regex, logs, re.MULTILINE) or "BREAKING CHANGE" in logs
        is_feat = re.search(r"^feat(\(.*\))?:", logs, re.MULTILINE)

        next_ver = ""

        if is_breaking:
            if major == 0:
                next_ver = f"{major}.{minor + 1}.0-rc.1"
            else:
                next_ver = f"{major + 1}.0.0-rc.1"
        elif is_feat:
            if patch > 0:
                next_ver = f"{major}.{minor + 1}.0-rc.1"
            else:
                next_ver = f"{major}.{minor}.{patch}-rc.{rc + 1}"
        else:
            next_ver = f"{major}.{minor}.{patch}-rc.{rc + 1}"
        
        print(f"Calculated next version: {next_ver}")
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"next_version={next_ver}\n")
            
    except Exception as e:
        print(f"Error: {e}")
        pass

if __name__ == "__main__":
    main()
