# SolarisPKN-Labs

🇺🇸 English | 🇦🇷 [Español](README.es.md)

## Overview

SolarisPKN-Labs is the official development website for the SolarisPKN ecosystem.

The project is currently in an early development stage and serves as a central place to present projects, experiments, technical documentation and future developments.

Its main purpose is to provide a structured and accessible way to explore the work being developed under the SolarisPKN name.

## Current Status

⚠️ This project is actively under development.

At the moment, SolarisPKN-Labs is primarily a public website and learning project used to:

* Learn and experiment with modern web technologies.
* Build a personal technology portfolio.
* Centralize future projects and documentation.
* Develop the foundation for future features and integrations.

## Features

Current features:

* Public website.
* Responsive design.
* Project showcase structure.
* Basic navigation.
* Cloudflare Pages deployment.

Planned features:

* Technical documentation.
* Project catalog.
* Development blog.
* Architecture section.
* Open-source project integration.
* Firmware showcase.
* Membership and account system.
* Product and licensing system.

## Goals

The long-term goal of SolarisPKN-Labs is to become a central hub for:

* Software development projects.
* Embedded systems projects.
* ESP32 development.
* Infrastructure and cloud technologies.
* Automation projects.
* Technical documentation.
* Open-source initiatives.

## Technology Stack

Current technologies:

* HTML
* CSS
* JavaScript
* GitHub
* Cloudflare Pages

Future technologies under evaluation:

* Astro
* Cloudflare Workers
* Cloudflare D1
* GitHub Actions

## Website

Production Website:

https://solarispkn.pages.dev

## Repository

GitHub:

https://github.com/SolarisPKN

## Project Philosophy

SolarisPKN-Labs is intended to be more than a portfolio.

The objective is to document projects, experiments, lessons learned and technical solutions while continuously improving the platform itself.

In simple terms:

A project designed to contain other projects.

## Roadmap

### Phase 1

* Initial website
* Project structure
* Public deployment

### Phase 2

* Documentation system
* Project pages
* Architecture section

### Phase 3

* User accounts
* Membership features
* Content organization

### Phase 4

* Product distribution
* Licensing system
* Advanced integrations

## License

License information will be defined in a future release.

## Visit analytics (GA4)

The public GA4 measurement ID `G-66ZYMRXVCE` is set in the shared layout. It can optionally be overridden at build time using `PUBLIC_GA_MEASUREMENT_ID`; it is **not** an API secret.

- Google's tag is **not fetched or called before opt-in**. Declining does not affect site usage.
- The preference is stored locally and can be changed using the footer settings.
- After opt-in, the browser talks directly to Google; Cloudflare Workers, D1 and KV receive no extra analytics traffic.
- GA4 Enhanced Measurement automatically counts initial and Astro ClientRouter history-driven pageviews; there are no manually emitted `page_view` events.
- In **Analytics → Admin → Data streams → Web → Enhanced measurement → Page views → Advanced settings**, keep page changes based on browser history events enabled.
- Counts may be lower due to blocking, consent, or network restrictions.

Regression test: `node --test scripts/analytics-consent.test.js`.
