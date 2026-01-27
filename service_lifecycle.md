Great question — this is exactly the right mental model to reach for 👍
Unix service semantics map very cleanly onto what you’re designing.

I’ll answer this in three layers:
	1.	Canonical Unix service verbs (what’s “typical”)
	2.	How pause fits (and why it’s less universal)
	3.	How “add / remove services” maps conceptually

No speculation, just well-established patterns.

⸻

1️⃣ Typical Unix service commands (canonical set)

Across SysV init, systemd, launchd, daemontools, etc., the core verbs are remarkably stable:

Universally recognized
	•	start
→ allocate resources, begin doing work
	•	stop
→ terminate work, release resources, clean state
	•	restart
→ stop + start (often atomic)
	•	status
→ introspection only

These are the bedrock.

⸻

2️⃣ Where does “pause” fit?

Important: pause is NOT universal

In Unix service land, pause is optional and semantic, not guaranteed.

Why?
	•	Many daemons cannot be meaningfully paused
	•	The OS historically prefers signals over semantic lifecycle verbs

The Unix equivalents of “pause”

When pause does exist, it’s usually implemented as:

Mechanism	Meaning
SIGSTOP	Hard kernel pause (cannot be intercepted)
SIGTSTP	Terminal-driven stop
SIGCONT	Resume
App-specific signal (e.g. SIGUSR1)	Soft pause

Key insight:

Pause ≠ stop-without-flush
Pause = suspend execution while preserving memory + state

Your description:

“hybrid stop but not flush”

matches soft pause, not stop.

Modern service managers (systemd)

systemd does support:
	•	stop
	•	reload (re-read config without full restart)
	•	freeze / thaw (cgroup-level suspension)

But again: pause is not assumed — it’s opt-in.

⸻

3️⃣ “Add / remove services” — what does Unix do?

This is where the analogy really helps.

Unix distinction (critical)

Unix separates:

Concern	Unix Concept
Registration	install / enable
Execution	start / stop
Existence	service file present or not

Typical verbs
	•	enable
→ register service to be startable / auto-startable
(e.g. systemctl enable foo)
	•	disable
→ unregister from auto-start, but do not stop if running
	•	mask / unmask
→ hard-disable (cannot be started)
	•	add / remove
→ package install / uninstall (outside service manager)

So in Unix:
	•	You do not “add a service” at runtime
	•	You register it
	•	You enable or disable it
	•	Then you start / stop it

⸻

Mapping this cleanly to DomChangeObserver (and m7 primitives)

Here’s the clean semantic mapping that fits Unix and your existing Interval/Log patterns:

Global (observer-level)

Unix	DomChangeObserver
start	start()
stop	stop() (disconnect + flush/clear)
pause	pause() (disconnect, keep pending)
resume	start() or resume()
status	state() / isRunning()

Selector-level (service-like but lighter)

Unix analogy	Selector action
enable	addSelector() or resumeSelector()
disable	pauseSelector()
remove	removeSelector()
reload	setSelectors() or updateSelector()
status	listSelectors()

Crucial alignment
	•	Selectors are closer to “enabled units” than processes
	•	The observer itself is the daemon
	•	Selectors are configuration-driven sub-units

This matches:
	•	IntervalManager (manager = daemon, intervals = units)
	•	Log Manager (manager = daemon, buckets = units)

⸻

Minimal, Unix-faithful command set you want

If you want to stay very Unix-true and not overdesign:

Global
	•	start
	•	stop
	•	pause
	•	status

Selector-level
	•	add
	•	remove
	•	enable
	•	disable
	•	list

No “restart selector”, no fancy transitions.

⸻

One last framing (important)

Unix teaches us:

Lifecycle ≠ registration ≠ configuration

Your instinct to separate:
	•	observer lifecycle
	•	selector lifecycle
	•	selector existence

is exactly right — and is why DomChangeObserver fits so cleanly as a primitive.

If you want, next we can:
	•	lock a Unix-aligned lifecycle vocabulary for all m7 primitives
	•	or draft a selector registry schema that mirrors systemctl list-units
	•	or decide whether selectors should be “pauseable” or just “enable/disable”

You’re asking the right questions in the right order.