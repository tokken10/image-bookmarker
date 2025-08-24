/* eslint-disable */
// @ts-nocheck
import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import InputBar from './InputBar';

describe('InputBar preview', () => {
  it('renders image preview for valid URL', () => {
    render(<InputBar onAddBookmark={() => {}} />);
    const urlInput = screen.getByLabelText(/image url/i) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/test.jpg' } });
    const img = screen.getByAltText('Image preview');
    expect(img).toBeInTheDocument();
  });

  it('removes preview when URL is cleared', () => {
    render(<InputBar onAddBookmark={() => {}} />);
    const urlInput = screen.getByLabelText(/image url/i) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/test.jpg' } });
    expect(screen.getByAltText('Image preview')).toBeInTheDocument();
    fireEvent.change(urlInput, { target: { value: '' } });
    expect(screen.queryByAltText('Image preview')).toBeNull();
  });

  it('clears preview when clear button clicked', () => {
    render(<InputBar onAddBookmark={() => {}} />);
    const urlInput = screen.getByLabelText(/image url/i) as HTMLInputElement;
    fireEvent.change(urlInput, { target: { value: 'https://example.com/test.jpg' } });
    const clearButton = screen.getByRole('button', { name: /clear preview/i });
    fireEvent.click(clearButton);
    expect(screen.queryByAltText('Image preview')).toBeNull();
  });
});
