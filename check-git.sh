#!/bin/bash
echo "=== Git Status ==="
git status
echo ""
echo "=== Last Commit ==="
git log --oneline -1
echo ""
echo "=== Remote Status ==="
git status -sb
