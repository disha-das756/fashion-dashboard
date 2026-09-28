import { render, screen } from '@testing-library/react';
import App from './App';

test('renders BuyMore brand title in navigation bar', () => {
  render(<App />);
  const brandElement = screen.getByText(/BuyMore/i);
  expect(brandElement).toBeInTheDocument();
});

test('renders Collections hero banner', () => {
  render(<App />);
  const heroElement = screen.getByText(/Collections/i);
  expect(heroElement).toBeInTheDocument();
});
