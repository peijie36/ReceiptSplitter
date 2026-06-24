<!-- Improved compatibility of back to top link: See: https://github.com/othneildrew/Best-README-Template/pull/73 -->
<a name="readme-top"></a>



<!-- PROJECT SHIELDS -->
[![React][react-shield]][react-url]
[![TypeScript][typescript-shield]][typescript-url]
[![Vite][vite-shield]][vite-url]
[![Vitest][vitest-shield]][vitest-url]
[![Playwright][playwright-shield]][playwright-url]



<!-- PROJECT LOGO -->
<br />
<div align="center">
  <h3 align="center">ReceiptSplitter</h3>

  <p align="center">
    A local-first web app for splitting receipts when one person paid the bill.
    <br />
    <a href="https://github.com/peijie36/ReceiptSplitter"><strong>Explore the docs »</strong></a>
    <br />
    <br />
    <a href="https://github.com/peijie36/ReceiptSplitter/issues">Report Bug</a>
    ·
    <a href="https://github.com/peijie36/ReceiptSplitter/issues">Request Feature</a>
  </p>
</div>



<!-- TABLE OF CONTENTS -->
<details>
  <summary>Table of Contents</summary>
  <ol>
    <li>
      <a href="#about-the-project">About The Project</a>
      <ul>
        <li><a href="#built-with">Built With</a></li>
        <li><a href="#calculation-rules">Calculation Rules</a></li>
      </ul>
    </li>
    <li>
      <a href="#getting-started">Getting Started</a>
      <ul>
        <li><a href="#prerequisites">Prerequisites</a></li>
        <li><a href="#installation">Installation</a></li>
      </ul>
    </li>
    <li><a href="#usage">Usage</a></li>
    <li><a href="#scripts">Scripts</a></li>
    <li><a href="#project-structure">Project Structure</a></li>
    <li><a href="#roadmap">Roadmap</a></li>
    <li><a href="#contributing">Contributing</a></li>
    <li><a href="#license">License</a></li>
    <li><a href="#contact">Contact</a></li>
    <li><a href="#acknowledgments">Acknowledgments</a></li>
  </ol>
</details>



<!-- ABOUT THE PROJECT -->
## About The Project

ReceiptSplitter is a web-only utility for a payer who needs to split a receipt across several participants. It keeps the flow small and fast: add people, enter bill items, assign each item, apply tax and tip, then save a local summary of who owes the payer.

The app is local-first and stores drafts and saved splits in browser local storage. It does not use authentication, backend APIs, databases, payment integrations, syncing, or cloud OCR.

Key features:

* Add, edit, and remove participants.
* Choose the payer for the bill.
* Split by assigned receipt items or split the whole bill equally.
* Scan English receipt images locally in the browser, then review and assign detected items.
* Allocate tax and tip equally or proportionally by item subtotal.
* Save split snapshots locally and reopen them later.
* Mark owed participants as paid on saved split summaries.
* Copy a payment summary from a saved split.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Built With

* [![React][react-shield]][react-url]
* [![TypeScript][typescript-shield]][typescript-url]
* [![Vite][vite-shield]][vite-url]
* [![Zustand][zustand-shield]][zustand-url]
* [![TanStack Router][tanstack-router-shield]][tanstack-router-url]
* [![Tailwind CSS][tailwind-shield]][tailwind-url]
* [![Vitest][vitest-shield]][vitest-url]
* [![Playwright][playwright-shield]][playwright-url]

<p align="right">(<a href="#readme-top">back to top</a>)</p>



### Calculation Rules

ReceiptSplitter keeps money values as integer cents and centralizes calculation logic in pure utility functions. Itemized splits divide each item equally among its assigned participants. Tax and tip can be allocated proportionally by participant subtotal or equally across participants.

Rounding is deterministic. When cents do not divide evenly, the app distributes remainder cents in a stable order so final participant totals reconcile exactly to the full bill total. The payer is included in subtotal, tax, and tip calculations, but excluded from the final "who owes the payer" list.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- GETTING STARTED -->
## Getting Started

Follow these steps to run ReceiptSplitter locally.

### Prerequisites

* Node.js
* pnpm

This project is configured for `pnpm@10.21.0`.

### Installation

1. Clone the repo.
   ```sh
   git clone https://github.com/peijie36/ReceiptSplitter.git
   ```
2. Open the project directory.
   ```sh
   cd ReceiptSplitter
   ```
3. Install packages.
   ```sh
   pnpm install
   ```
4. Start the development server.
   ```sh
   pnpm dev
   ```

No API keys or environment variables are required for local use.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- USAGE EXAMPLES -->
## Usage

1. Start a fresh split from the home page.
2. Add participants and select the payer.
3. Choose itemized mode or whole-bill equal mode.
4. In itemized mode, add items with amounts and assign each item to one or more participants.
5. Optionally scan a JPEG, PNG, or WebP receipt, review every detected field, and choose whether to append or replace existing receipt data.
6. Add tax and tip, then choose equal or proportional allocation.
7. Review the live summary and save the split.
8. Open a saved split to view totals, copy the payment summary, or mark repayments as paid.

Drafts and saved split history persist in browser local storage, so they survive refreshes and browser restarts on the same device and browser profile.

Receipt images, raw OCR text, and unconfirmed scan results are not persisted or uploaded. The first scan may download the Tesseract.js worker and English language assets.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- SCRIPTS -->
## Scripts

* `pnpm dev` - start the Vite development server.
* `pnpm build` - run TypeScript checks and build the production bundle.
* `pnpm typecheck` - run TypeScript checks without building.
* `pnpm test` - run the Vitest suite once.
* `pnpm test:watch` - run Vitest in watch mode.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- PROJECT STRUCTURE -->
## Project Structure

```text
src/
  components/       Reusable UI and split editor sections
  features/         Cohesive optional capabilities such as receipt scanning
  routes/           TanStack Router page components
  store/            Zustand persisted app state
  types/            Split and calculation types
  utils/            Money, validation, persistence, and split calculations
  main.tsx          React app entry point
  router.tsx        Route definitions
```

Calculation-heavy utilities are covered by Vitest tests under `src/utils/*.test.ts`. Route and component behavior has focused tests under `src/routes` and `src/components`.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ROADMAP -->
## Roadmap

Current project focus:

* [x] Local draft persistence
* [x] Saved split history
* [x] Itemized receipt splitting
* [x] Whole-bill equal splitting
* [x] Equal and proportional tax allocation
* [x] Equal and proportional tip allocation
* [x] Payment summary copy action
* [x] Repayment status tracking
* [x] Browser-only English receipt scanning

See the [open issues](https://github.com/peijie36/ReceiptSplitter/issues) for proposed features and known issues.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTRIBUTING -->
## Contributing

Contributions should keep the app small, local-first, and web-only. Avoid adding backend services, authentication, syncing, payment integrations, cloud OCR, receipt-image uploads, or other features outside the payer-focused receipt splitting flow.

1. Fork the project.
2. Create your feature branch.
   ```sh
   git checkout -b feature/your-feature
   ```
3. Make focused changes with tests for calculation logic when relevant.
4. Run the relevant checks.
   ```sh
   pnpm test
   pnpm build
   ```
5. Commit your changes.
   ```sh
   git commit -m "Describe your change"
   ```
6. Push to the branch and open a pull request.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- LICENSE -->
## License

No license file is currently included in this repository.

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- CONTACT -->
## Contact

Peijie Zheng - [@peijie36](https://github.com/peijie36)

Project Link: [https://github.com/peijie36/ReceiptSplitter](https://github.com/peijie36/ReceiptSplitter)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- ACKNOWLEDGMENTS -->
## Acknowledgments

* [Best-README-Template](https://github.com/peijie36/Best-README-Template)
* [React](https://react.dev/)
* [Vite](https://vite.dev/)
* [Zustand](https://zustand-demo.pmnd.rs/)
* [TanStack Router](https://tanstack.com/router)
* [Vitest](https://vitest.dev/)
* [Playwright](https://playwright.dev/)
* [Tailwind CSS](https://tailwindcss.com/)
* [shadcn/ui](https://ui.shadcn.com/)

<p align="right">(<a href="#readme-top">back to top</a>)</p>



<!-- MARKDOWN LINKS & IMAGES -->
<!-- https://www.markdownguide.org/basic-syntax/#reference-style-links -->
[react-shield]: https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB
[react-url]: https://react.dev/
[typescript-shield]: https://img.shields.io/badge/TypeScript-3178C6?style=for-the-badge&logo=typescript&logoColor=white
[typescript-url]: https://www.typescriptlang.org/
[vite-shield]: https://img.shields.io/badge/Vite-646CFF?style=for-the-badge&logo=vite&logoColor=white
[vite-url]: https://vite.dev/
[zustand-shield]: https://img.shields.io/badge/Zustand-443E38?style=for-the-badge
[zustand-url]: https://zustand-demo.pmnd.rs/
[tanstack-router-shield]: https://img.shields.io/badge/TanStack_Router-FF4154?style=for-the-badge&logo=reactrouter&logoColor=white
[tanstack-router-url]: https://tanstack.com/router
[tailwind-shield]: https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwindcss&logoColor=white
[tailwind-url]: https://tailwindcss.com/
[vitest-shield]: https://img.shields.io/badge/Vitest-6E9F18?style=for-the-badge&logo=vitest&logoColor=white
[vitest-url]: https://vitest.dev/
[playwright-shield]: https://img.shields.io/badge/Playwright-2EAD33?style=for-the-badge&logo=playwright&logoColor=white
[playwright-url]: https://playwright.dev/
