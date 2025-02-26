# Dual Sigmoid Model for Language Change

An interactive visualization that models how grammatical feelings and community acceptance evolve over time using a dual sigmoid approach.

## About This Model

This visualization demonstrates a formalized approach to language change based on the interplay between:

- **F(u)**: The "feeling of ungrammaticality" (ranging from -1 to 0)
- **C(u)**: Community acceptance of a linguistic form (ranging from 0 to 1)
- **Frequency**: How often a construction appears in language use

The model uses independent sigmoid curves for both F(u) and C(u), with parameters that can be adjusted to explore different language change scenarios.

## Key Features

- Independent sigmoid curves for grammatical feeling and community acceptance
- Adjustable parameters (steepness, midpoints, influence weights)
- Pre-defined examples of grammatical edge cases
- Visual representation of the classic S-curves observed in language change

## Examples Included

- "I've finished it yesterday" - Temporal conflict between perfect aspect and past time adverbial
- "It very good" - Missing copula in predicative construction
- "We sheared three sheeps" - Overgeneralization of regular plural morphology
- "I saw Joan, a friend of whose was visiting" - Non-standard relative clause formation

## Running Locally

1. Clone this repository
2. Run `npm install` to install dependencies
3. Run `npm start` to start the development server
4. Open [http://localhost:3000](http://localhost:3000) to view it in your browser

## Deployment

This project is deployed using GitHub Pages. Visit [the live demo](https://BrettRey.github.io/MMMG) to see it in action.

## Technology Stack

- React.js
- Recharts for data visualization
- Tailwind CSS for styling
