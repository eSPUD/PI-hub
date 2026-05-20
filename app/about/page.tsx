"use client";
import Link from "next/link";

export default function AboutPage() {
  return (
    <div className="stack landing">
      <section className="landing-hero">
        <div className="landing-hero-text">
          <h1>PI-hub</h1>
          <p className="landing-tagline">
            A research hub for the Principal Investigator. Projects, team, paper deadlines, and
            an exploration log — all in one place, all on your device.
          </p>
          <div className="landing-cta">
            <Link href="/" className="btn btn-add btn-add-project">Open the dashboard →</Link>
            <a
              href="https://github.com/eSPUD/PI-hub"
              target="_blank"
              rel="noreferrer"
              className="btn"
            >
              View on GitHub
            </a>
          </div>
        </div>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src="/logo.png" alt="PI-hub logo" className="landing-logo" />
      </section>

      <section className="card">
        <h2>What PI-hub does</h2>
        <div className="landing-grid">
          <Feature
            title="Projects"
            body="Plan, set up, and journal each project. Track status (exploration → planning → active → paused → archived), description, Discord / Overleaf links, contributors, artifacts, and an append-only exploration log."
          />
          <Feature
            title="Team members"
            body="A first-class roster with avatars, role, affiliation, GitHub, and expertise. Assign or unassign members to any project from either side via a toggle."
          />
          <Feature
            title="Deadlines & call-for-papers"
            body="Track conferences with abstract / submission / notification / conference dates. A timeline visualization plus a live D:HH:MM:SS countdown to the next deadline. Each project assigned to a CFP carries an assessment status: not started, in progress, submitted, accepted, rejected, late, abandoned."
          />
          <Feature
            title="PI profile"
            body="Identity, affiliation, contact, online profiles (ORCID, Google Scholar, GitHub, LinkedIn, X), bio, focus areas, expertise tags, education, and selected publications."
          />
          <Feature
            title="Dashboard"
            body="Top-3 upcoming deadlines with countdowns, status overview donut, recent log activity, top contributors, and a project table with avatar stacks and progress bars."
          />
          <Feature
            title="PDF reports"
            body="One-click Export PDF on any project produces a well-spaced, paginated report with overview, plan, setup, team, target venues with status, artifacts, and the full log. Generated in your browser — never uploaded."
          />
          <Feature
            title="Archive, don't delete"
            body="Projects, members, and CFPs are archived (hidden) rather than deleted. The Archives page restores any item with one click, or permanently deletes after a double-confirmation."
          />
          <Feature
            title="Installable PWA"
            body="Install PI-hub from your browser's address bar to get a real dock/home-screen icon. The installed app launches in its own window and works fully offline after the first visit."
          />
        </div>
      </section>

      <section className="card">
        <h2>Your data stays on your device</h2>
        <p>
          PI-hub has no backend. Nothing you type leaves your browser. There is no account, no
          sign-in, no telemetry, and no remote database.
        </p>
        <p>
          Every project, member, CFP, and log entry lives in this browser&apos;s{" "}
          <strong>IndexedDB</strong>, scoped to the origin (the domain you visit) and the
          browser profile you&apos;re using. The host that served you the app sees only that
          you loaded a static HTML/JS bundle — the same way you&apos;d load any website.
        </p>
        <div className="landing-grid">
          <Feature
            title="Local-only storage"
            body="IndexedDB is a real database that lives inside your browser. It survives reloads and reboots. It is never sent over the network by PI-hub."
          />
          <Feature
            title="Works offline"
            body="A service worker caches the app shell after your first visit. You can launch and use PI-hub with no internet connection."
          />
          <Feature
            title="No tracking"
            body="No analytics, no cookies, no third-party scripts beyond the bundled libraries. The footer link to eSPUD opens in a new tab; nothing else phones home."
          />
          <Feature
            title="Per-device, per-profile"
            body="Chrome on your laptop is a separate dataset from Safari on your iPad. Firefox profile A is separate from Firefox profile B. Plan for that — see backup below."
          />
        </div>
      </section>

      <section className="card landing-warn">
        <h2>Keeping your data safe</h2>
        <p className="muted">
          Because data lives in your browser, you are responsible for backups. Treat this app
          like a notebook on your desk: the only copy is the one you have.
        </p>
        <h3 className="landing-sub">Do this regularly</h3>
        <ul className="landing-list">
          <li>
            Open <Link href="/settings">Settings</Link> and click{" "}
            <strong>Download JSON</strong> (or <strong>Download ZIP</strong>) every week or
            two. Keep the file somewhere safe — your cloud drive, a USB stick, or your home
            directory.
          </li>
          <li>
            Before any browser update, OS reinstall, or laptop reset, run a backup first.
          </li>
          <li>
            Before you visit Settings → <strong>Wipe everything</strong>, take a fresh
            backup. Wipe is irreversible.
          </li>
        </ul>

        <h3 className="landing-sub">What can lose data</h3>
        <ul className="landing-list">
          <li>
            <strong>Browser clears site data.</strong> Clearing &quot;cookies and site
            data&quot; for this site also wipes IndexedDB. Some browsers do this automatically
            for sites you haven&apos;t visited in a long time.
          </li>
          <li>
            <strong>Disk pressure eviction.</strong> If your disk fills up, the browser may
            evict storage for sites it considers low-priority. Installed PWAs get higher
            priority than tabs, which is one good reason to install PI-hub.
          </li>
          <li>
            <strong>Incognito / Private windows.</strong> Data entered in these windows is
            discarded when you close the last private tab. Use a normal window.
          </li>
          <li>
            <strong>Uninstalling the PWA</strong> can also clear its storage, depending on
            the browser. Back up first.
          </li>
          <li>
            <strong>Switching browsers or devices.</strong> Edge cannot read Chrome&apos;s
            IndexedDB; your iPhone can&apos;t read your laptop&apos;s. Use Settings →
            Download / Restore to move data between them.
          </li>
        </ul>

        <h3 className="landing-sub">Restoring from a backup</h3>
        <ol className="landing-list">
          <li>
            Open <Link href="/settings">Settings</Link> on the device where you want the data.
          </li>
          <li>Click <strong>Restore</strong> and pick the JSON or ZIP backup file.</li>
          <li>
            Items with the same id are overwritten. To restore into an empty slate, click{" "}
            <strong>Wipe everything</strong> first.
          </li>
        </ol>
      </section>

      <section className="card">
        <h2>Getting started</h2>
        <ol className="landing-list">
          <li>
            <Link href="/pi">Set up your PI profile</Link> — name, affiliation, focus areas.
          </li>
          <li><Link href="/projects/new">Create your first project</Link>.</li>
          <li>
            <Link href="/members/new">Add team members</Link> and assign them to projects.
          </li>
          <li>
            <Link href="/cfps/new">Add a call-for-papers</Link> and target your project at it.
          </li>
          <li>
            Take your first backup from <Link href="/settings">Settings</Link>.
          </li>
          <li>
            <strong>Install PI-hub:</strong> in Chrome / Edge, click the install icon (⊕) in
            the address bar. On macOS Safari, File → Add to Dock. On iOS, Share → Add to Home
            Screen.
          </li>
        </ol>
        <p className="muted small" style={{ marginTop: 12 }}>
          Open-source under the MIT license. Built by{" "}
          <a href="https://espud.github.io/eSPUD/" target="_blank" rel="noreferrer">eSPUD</a>.
          Issues and pull requests welcome at{" "}
          <a href="https://github.com/eSPUD/PI-hub" target="_blank" rel="noreferrer">
            github.com/eSPUD/PI-hub
          </a>
          .
        </p>
      </section>
    </div>
  );
}

function Feature({ title, body }: { title: string; body: string }) {
  return (
    <div className="landing-feature">
      <h3>{title}</h3>
      <p className="muted">{body}</p>
    </div>
  );
}
