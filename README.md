# RUA Winner — EuroJackpot Analysis & Numbers Evaluation

RUA Winner is a TypeScript monorepo that delivers EuroJackpot statistics, charts, and a personal “numbers evaluation” tool across web (and later mobile/desktop). It supports **light/dark** themes plus a **light blue** brand theme. Data can be imported **locally** (Excel/CSV) for fast, offline-friendly analysis, and will later sync from **Amazon S3** with single-active-session authentication.

---

## ✨ Features (current)

- **Web app (Next.js 14)** with Tailwind and `next-themes` (light/dark/brand blue).
- **Local data import** (`.xlsx` or `.csv`) via client-side parser (no backend required).
- **Personal Numbers Evaluation** — enter 5 main + 2 Euro numbers, see:
    - how many times they would have won in each class (GKL1–GKL12)
    - total winnings per class and grand total
- **Analytics (Preview)**
    - Top Main Numbers (1–50)
    - Euro Numbers (1–12)
    - Jackpot (GKL1) Over Time
    - Prize Class Distribution (Count / Avg € toggle)

---

## 🧱 Repository Structure

rua-winner/
├─ apps/
│ └─ web/ # Next.js 14 app (SSR/CSR), Recharts, Tailwind, next-themes
├─ packages/
│ └─ core/ # Pure TypeScript domain logic (evaluation + analytics helpers)
├─ tooling/
│ └─ ci/ # (reserved) CI/CD workflows
├─ package.json # workspace scripts (Turbo)
├─ pnpm-workspace.yaml # pnpm workspaces
├─ turbo.json # Turborepo pipeline config
├─ tsconfig.base.json # base TS config
└─ README.md # this file

---

## 🧰 Tech Stack

- **Language**: TypeScript (5.x)
- **Web**: Next.js 14, React 18, Tailwind CSS 3, next-themes
- **Charts**: Recharts
- **Data parsing**: `xlsx` (works for `.xlsx` and `.csv`)
- **Monorepo**: pnpm workspaces + Turborepo
- **Core logic**: `@rua-winner/core` (shared types + evaluation + analytics)

---

## 🧑‍💻 Prerequisites

- **Node.js**: 20.18.1 (LTS)
- **pnpm**: 9.x
  ```bash
  npm i -g pnpm
