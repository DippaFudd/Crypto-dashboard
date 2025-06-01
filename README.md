# Crypto Portfolio Dashboard

A modern, interactive cryptocurrency portfolio tracker built with Next.js, Tailwind CSS, and the CoinGecko API.

## Screenshots
![Image Alt]()
![Image Alt]()

## Features

- **Live Data**: Real-time cryptocurrency prices and market data from CoinGecko API
- **Portfolio Tracking**: Keep track of your cryptocurrency investments
- **Transaction Management**: Add buy/sell transactions to build your portfolio
- **Market Overview**: View top cryptocurrencies by market capitalization
- **Visual Design**: Modern UI with animations, glass morphism effects, and responsive design
- **Local Storage**: Persists your transactions and portfolio data in your browser

## Technology Stack

- **Framework**: Next.js 14+
- **Styling**: Tailwind CSS with custom animations
- **UI Components**: shadcn/ui component library
- **APIs**: CoinGecko for cryptocurrency data
- **State Management**: React useState/useEffect for local state
- **Storage**: Browser localStorage for transaction persistence

## Getting Started

### Prerequisites

- Node.js 18+ and npm/yarn

### Installation

1. Clone the repository:
\`\`\`bash
git clone https://github.com/yourusername/crypto-portfolio-dashboard.git
cd crypto-portfolio-dashboard
\`\`\`

2. Install dependencies:
\`\`\`bash
npm install
# or
yarn install
\`\`\`

3. Start the development server:
\`\`\`bash
npm run dev
# or
yarn dev
\`\`\`

4. Open [http://localhost:3000](http://localhost:3000) in your browser.

## Usage

### Adding Transactions

1. Click the "Add Transaction" button in the top-right corner
2. Select the transaction type (buy/sell)
3. Search for the cryptocurrency you want to add
4. Enter the amount and price (price will be pre-filled with current market price)
5. Click "Buy" or "Sell" to add the transaction

### Viewing Portfolio

- The main dashboard shows your total portfolio value and 24-hour change
- The "Portfolio" tab displays all your current holdings
- The "Markets" tab shows the top cryptocurrencies by market cap
- The "Transactions" tab lists your transaction history

## Data Storage

All portfolio data is stored in your browser's localStorage. No data is sent to or stored on any servers.

## Limitations

- The CoinGecko API has rate limits which may affect data loading times
- Only supports USD as the base currency currently
- No user accounts or cloud sync (data is stored locally in your browser)

## Future Improvements

- Add authentication for user accounts
- Support for multiple portfolios
- Additional base currencies
- Price alerts and notifications
- Historical portfolio performance tracking
- Dark/light theme toggle
- CSV import/export functionality

## License

This project is licensed under the MIT License - see the LICENSE file for details.

## Acknowledgements

- [CoinGecko API](https://www.coingecko.com/api/documentation) for cryptocurrency data
- [shadcn/ui](https://ui.shadcn.com) for the UI components
- [Tailwind CSS](https://tailwindcss.com) for styling
- [Next.js](https://nextjs.org) for the React framework
