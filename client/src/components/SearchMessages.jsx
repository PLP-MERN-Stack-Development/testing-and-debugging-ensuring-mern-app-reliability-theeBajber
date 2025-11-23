import React, { useState } from 'react';

const SearchMessages = ({ messages, onSearch }) => {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
    onSearch(value);
  };

  const clearSearch = () => {
    setQuery('');
    onSearch('');
    setIsOpen(false);
  };

  return (
    <div className="search-messages">
      <button
        className="search-toggle"
        onClick={() => setIsOpen(!isOpen)}
      >
        🔍
      </button>
      
      {isOpen && (
        <div className="search-box">
          <input
            type="text"
            placeholder="Search messages..."
            value={query}
            onChange={handleSearch}
            className="search-input"
          />
          <button onClick={clearSearch} className="clear-search">
            ✕
          </button>
        </div>
      )}
    </div>
  );
};

export default SearchMessages;