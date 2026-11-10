"""
Universal Windows Interaction Engine (UWIE)
Core package for closed-loop, verified Windows UI automation.
Observe -> Understand -> Plan -> Act -> Verify -> Recover
"""

from .window_observer import WindowObserver
from .dialog_tracker import DialogTracker
from .element_observer import ElementObserver
from .state_snapshot import StateSnapshot, UIState
from .state_verifier import StateVerifier

__all__ = [
    "WindowObserver",
    "DialogTracker",
    "ElementObserver",
    "StateSnapshot",
    "UIState",
    "StateVerifier"
]
