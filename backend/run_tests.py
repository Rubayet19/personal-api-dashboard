#!/usr/bin/env python
import pytest
import sys
import os

if __name__ == "__main__":
    # Add current directory to path to ensure imports work
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    
    # Run all tests in the tests directory
    pytest.main(["-xvs", "tests/"]) 