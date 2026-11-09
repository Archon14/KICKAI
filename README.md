# KICKAI

**Open-Source Football Intelligence Platform**

*From the Community. By the Community. For the Community.*

KICKAI is an open-source football intelligence platform designed to make data-driven match analysis, tactical insights, and player development tools more accessible.

The project combines football analytics, computer vision, statistical modelling, and an interactive web interface in a modular architecture.

**Project status:** Active development and community testing.

## 1. Overview

KICKAI provides a foundation for analysing football matches, exploring tactical decisions, evaluating player performance, and developing AI-assisted coaching workflows.

The platform is designed for:

- Football players and coaches
- Analysts and researchers
- Students and educators
- Independent developers
- Open-source contributors
- Football enthusiasts

KICKAI aims to support practical football analysis without requiring users to build an entire analytics platform from scratch.

## 2. Core Capabilities

### Match Analysis

Tools for examining match events, team performance, and tactical patterns.

### Match Prediction

Statistical match prediction workflows using team information, estimated performance metrics, and simulation-based approaches.

Predictions are estimates and should not be treated as guaranteed outcomes.

### Tactical Intelligence

Formation exploration, tactical visualisation, and tools for comparing possible team structures and strategies.

### Player Analytics

Player information, performance metrics, and comparison-oriented interfaces to support player evaluation.

### Video and Computer Vision

Integration with computer vision components for football video processing, object detection, tracking, and related analysis workflows.

Performance depends on the available models, datasets, and computing resources.

### AI-Assisted Coaching

Experimental coaching interfaces that combine analytical feedback with interactive presentation and communication features.

### Reports and Data Export

Components for generating and presenting structured football analytics results.

### Community Development

A modular codebase intended to support collaboration, experimentation, documentation, and independent contributions.

**Development note:** KICKAI contains working components, experimental features, and integrations at different levels of maturity. Not every interface or analytical workflow is production-ready.

## 3. Technology Stack

| Component | Technology |
|---|---|
| Backend | Python, FastAPI, Uvicorn, Pydantic |
| Frontend | Next.js 16, React, TypeScript |
| Styling | Tailwind CSS |
| Computer Vision | OpenCV, Ultralytics and integrated research components |
| Analytics | Python-based statistical and simulation modules |
| API Communication | HTTP APIs and WebSocket components |
| Configuration | Environment variables |
| Version Control | Git and GitHub |

Additional dependencies and requirements are documented in the relevant project directories.

## 4. Project Architecture

KICKAI follows a modular architecture separating user interfaces, API services, analytical components, and external integrations.

```text
KICKAI/
|
|-- analytics/           Football analytics and prediction
|-- api/                 Additional API components
|-- backend/             FastAPI application and routers
|-- core/                Core application functionality
|-- data/                Project data and supporting resources
|-- docs/                Documentation
|-- external_engines/    Integrated third-party components
|-- extractors/          Data extraction and transformation
|-- frontend/            Next.js web application
|-- knowledge/           Supporting knowledge resources
|-- scripts/             Development utilities
|-- tests/               Automated tests
|
|-- kickai_core.py       Standalone application components
|-- start.py             Project startup utility
|-- requirements.txt     Python dependencies
|-- LICENSE              Main project license
|-- LICENSING.md         Licensing and attribution information
|-- README.md            Project documentation
```

Individual modules may have additional dependencies, configuration requirements, and execution procedures.

## 5. Getting Started

### Prerequisites

Before running KICKAI, install:

- Git
- Python
