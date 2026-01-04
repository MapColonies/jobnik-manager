#!/usr/bin/env python3
import os
import re
import subprocess
import sys

# --- CONFIGURATION ---
BOT_COMMIT_MSG = "chore: enforce correct rc version"
BOT_FOOTER_TAG = "Release-As:"

def run_git_command(args, fail_on_error=True):
    """
    Executes a git command and returns the stripped stdout.
    Returns None if the command fails and fail_on_error is False.
    """
    try:
        result = subprocess.run(["git"] + args, stdout=subprocess.PIPE, text=True, check=fail_on_error)
        return result.stdout.strip()
    except subprocess.CalledProcessError:
        return None

def find_baseline_tag():
    """
    Finds the starting point for version calculation.
    Priority:
    1. Latest RC tag (e.g., v0.1.1-rc.1) -> Returns (tag, is_stable=False)
    2. Latest Stable tag (e.g., v0.1.0)  -> Returns (tag, is_stable=True)
    3. No tags -> Returns (None, is_stable=True) (Implies 0.0.0)
    """
    # 1. Try to find an existing RC tag
    rc_tag = run_git_command(["describe", "--tags", "--match", "v*-rc*", "--abbrev=0"], fail_on_error=False)
    if rc_tag:
        return rc_tag, False

    # 2. Fallback: Try to find a stable tag
    stable_tag = run_git_command(["describe", "--tags", "--match", "v*", "--exclude", "*-rc*", "--abbrev=0"], fail_on_error=False)
    if stable_tag:
        return stable_tag, True

    # 3. No tags found (Fresh repo)
    print("INFO: No tags found. Assuming 0.0.0 baseline.")
    return None, True

def get_commit_depth(baseline_tag):
    """
    Counts the number of 'user' commits since the baseline tag.
    Filters out bot commits to prevent infinite loops.
    """
    rev_range = f"{baseline_tag}..HEAD" if baseline_tag else "HEAD"
    
    raw_subjects = run_git_command(["log", rev_range, "--pretty=format:%s"], fail_on_error=False)
    if not raw_subjects:
        return 0

    # Filter out bot commits
    real_commits = [
        s for s in raw_subjects.split('\n')
        if BOT_FOOTER_TAG not in s and BOT_COMMIT_MSG not in s
    ]
    return len(real_commits)

def parse_semver(tag):
    """
    Parses a tag into (major, minor, patch, rc).
    Handles both 'v1.0.0' and 'v1.0.0-rc.1'.
    Returns default 0.0.0.0 if tag is None.
    """
    if not tag:
        return 0, 0, 0, 0

    # Try RC pattern first
    m_rc = re.match(r"^v(\d+)\.(\d+)\.(\d+)-rc\.(\d+)$", tag)
    if m_rc:
        return int(m_rc[1]), int(m_rc[2]), int(m_rc[3]), int(m_rc[4])

    # Try Stable pattern
    m_stable = re.match(r"^v(\d+)\.(\d+)\.(\d+)$", tag)
    if m_stable:
        return int(m_stable[1]), int(m_stable[2]), int(m_stable[3]), 0

    print(f"WARNING: Could not parse tag '{tag}'. Defaulting to 0.0.0")
    return 0, 0, 0, 0

def analyze_impact(baseline_tag):
    """
    Scans commit messages since baseline to detect 'feat' or 'breaking changes'.
    """
    rev_range = f"{baseline_tag}..HEAD" if baseline_tag else "HEAD"
    logs = run_git_command(["log", rev_range, "--pretty=format:%B"], fail_on_error=False)
    
    if not logs:
        return False, False

    breaking_regex = r"^(feat|fix|refactor)(\(.*\))?!:"
    is_breaking = re.search(breaking_regex, logs, re.MULTILINE) or "BREAKING CHANGE" in logs
    is_feat = re.search(r"^feat(\(.*\))?:", logs, re.MULTILINE)

    return bool(is_breaking), bool(is_feat)

def calculate_next_version(major, minor, patch, rc, depth, is_breaking, is_feat, from_stable):
    """
    Core Logic: Applies SemVer rules + your custom 'Hybrid RC' logic.
    """
    # 1. Determine the SemVer increment type
    if is_breaking:
        # Custom Rule: Force Major Bump (even for v0.x)
        # 0.1.1 -> 1.0.0
        return f"{major + 1}.0.0-rc.{depth}"
    
    if is_feat:
        if from_stable or patch > 0:
            # New Feature on stable or patch -> Minor Jump
            # 0.1.0 + feat -> 0.2.0
            # 0.1.1 + feat -> 0.2.0
            return f"{major}.{minor + 1}.0-rc.{depth}"
        else:
            # Already on a Minor candidate -> Accumulate
            # 0.2.0-rc.1 + feat -> 0.2.0-rc.X
            # Note: If from_stable is True, we wouldn't reach here (handled above)
            return f"{major}.{minor}.{patch}-rc.{rc + depth}"

    # 2. Default: Fix/Chore
    if from_stable:
        # 0.1.0 + fix -> 0.1.1
        return f"{major}.{minor}.{patch + 1}-rc.{depth}"
    else:
        # 0.1.1-rc.1 + fix -> 0.1.1-rc.X
        return f"{major}.{minor}.{patch}-rc.{rc + depth}"

def main():
    try:
        # 1. Baseline
        tag, from_stable = find_baseline_tag()
        
        # 2. Count Commits
        depth = get_commit_depth(tag)
        if depth == 0:
            print("INFO: No user commits found since baseline. Exiting.")
            return

        # 3. Parse Current State
        major, minor, patch, rc = parse_semver(tag)
        
        # 4. Analyze Changes
        is_breaking, is_feat = analyze_impact(tag)

        # 5. Calculate
        next_ver = calculate_next_version(
            major, minor, patch, rc, 
            depth, is_breaking, is_feat, from_stable
        )

        # 6. Output
        print(f"Base: {tag if tag else '0.0.0'} (Stable: {from_stable})")
        print(f"Depth: {depth} | Breaking: {is_breaking} | Feat: {is_feat}")
        print(f"Next Version: {next_ver}")
        
        with open(os.environ["GITHUB_OUTPUT"], "a") as f:
            f.write(f"next_version={next_ver}\n")

    except Exception as e:
        print(f"CRITICAL ERROR: {e}")
        # We exit 0 to allow the pipeline to continue (fallback to release-please native)
        sys.exit(0)

if __name__ == "__main__":
    main()
