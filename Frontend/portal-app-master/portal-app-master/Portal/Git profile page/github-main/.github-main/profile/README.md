# **🌐 Portal Technologies Inc.**

![](https://github.com/PortalTechnologiesInc/.github/blob/main/profile/logoFull.png?raw=true)

---

**A universal app for identity & payments. Smooth, secure, and self-sovereign.**

Welcome to the official GitHub organization for **Portal**: the user-facing interface to a fully decentralized identity and payment protocol. Portal makes it easy for anyone to log in, pay, and prove who they are without passwords or platform lock-in.

**🕳️ What Is Portal?**

**Portal** is a digital identity provider built on **Nostr** and **Lightning**. It manages your digital identity and public keys, acting as a secure approval layer for sensitive operations:

* ✅ Authorize passwordless logins
* 🤝 Approve single or recurring payments (Lightning & Cashu)
* 🔐 Share zero-knowledge proofs of documents like passports or driver's licenses

Behind the scenes, Portal is a **client** of a **decentralized FOSS protocol** we're developing. This protocol powers the logic and trust model — Portal simply gives users a clean, friendly interface to access it all.

**🛠️ Built With**

We utilize a modern, high-performance stack to ensure security and scalability:

* **Core Protocol & Backend:** Written in **Rust** 🦀 for safety, speed, and memory efficiency.
* **Client Applications:** Built with **TypeScript** (and **Svelte** for web demos) to ensure a responsive user experience.
* **SDKs & Integrations:** implementations available in **Java** and **Rust**.

**📲 What Can You Do with Portal?**

* Log in without usernames or passwords.
* Approve subscriptions and one-time payments with a tap.
* Authenticate in person using your device.
* Link any Nostr Wallet Connect-compatible wallet.
* Manage privacy-preserving e-cash (via Cashu).
* Share proofs of identity without leaking personal data.

Portal doesn’t custody your keys, funds, or data.

**📂 Projects Under This Org**

| Repository | Description | Tech Stack |
| :--- | :--- | :--- |
| [`portal-app`](https://github.com/PortalTechnologiesInc/portal-app) | **The Main App.** Digital identity provider built on Nostr & Lightning. | TypeScript |
| [`lib`](https://github.com/PortalTechnologiesInc/lib) | **Core Protocol.** The primary Rust implementation of the Portal protocol. | Rust |
| [`java-sdk`](https://github.com/PortalTechnologiesInc/java-sdk) | **Java SDK.** A client implementation for the Portal WebSocket Server. | Java |
| [`portal-access-control`](https://github.com/PortalTechnologiesInc/portal-access-control) | **Auth Service.** A microservice to manage user access control and permissions. | Rust |
| [`portal-business-app`](https://github.com/PortalTechnologiesInc/portal-business-app) | **Business Integration.** Logic and interface for merchant/business adoption. | TypeScript |
| [`cdk`](https://github.com/PortalTechnologiesInc/cdk) | **Cashu Dev Kit.** Our implementation/fork for handling Chaumian e-cash operations. | Rust |
| [`healthcheck-service`](https://github.com/PortalTechnologiesInc/healthcheck-service) | **Infrastructure.** Service monitoring and health status checks. | Rust |

**📝 License**

All code under this org is released under the **MIT License**, unless otherwise noted in specific repositories.

**🤝 Contribution**

Unless you explicitly state otherwise, any contribution intentionally submitted for inclusion in the work by you, as defined in the Apache-2.0 license, shall be dual licensed as above, without any additional terms or conditions.

📫 **Contact**

* **Website:** [https://getportal.cc](https://getportal.cc)
* **Twitter/X:** [@PortalOnX](https://x.com/PortalOnX)
* **Email:** `TBD`
