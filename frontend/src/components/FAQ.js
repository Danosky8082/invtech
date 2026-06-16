import React, { useState } from 'react';

const FAQ = () => {
  const faqs = [
    {
      q: 'What is InvTech?',
      a: 'InvTech is a simulation platform that lets you practice investing in stocks, bonds, ETFs, and cryptocurrencies. It helps you make smarter investment decisions by simulating real-market conditions without risking real money.'
    },
    {
      q: 'Is InvTech free to use?',
      a: 'Yes! InvTech is completely free to use. You can create an account, simulate investments, and learn about the market at no cost.'
    },
    {
      q: 'Do I need to invest real money?',
      a: 'No. InvTech is a simulation platform. You invest virtual money to learn and practice. Your virtual balance is for educational purposes only.'
    },
    {
      q: 'How accurate are the simulations?',
      a: 'Our simulations use real market data (exchange rates, stock prices from Yahoo Finance) and expected returns based on historical performance. While we strive to be as realistic as possible, past performance does not guarantee future results.'
    },
    {
      q: 'Is my personal information safe?',
      a: 'Yes. We take security seriously. Your password is hashed with bcrypt, and we use JSON Web Tokens (JWT) for authentication. We never share your data with third parties.'
    },
    {
      q: 'Can I invest in real money through this app?',
      a: 'No. InvTech is purely educational. We do not facilitate real trading or investing. It is designed to help you learn and practice before making real-world decisions.'
    },
    {
      q: 'How do I delete my account?',
      a: 'Contact our support team at support@invtech.com and we will assist you with account deletion.'
    }
  ];

  const [openIndex, setOpenIndex] = useState(null);

  const toggleFAQ = (index) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="faq-container">
      <h1>❓ Frequently Asked Questions</h1>
      <p>Find answers to common questions about InvTech.</p>

      <div className="faq-list">
        {faqs.map((faq, index) => (
          <div key={index} className="faq-item" onClick={() => toggleFAQ(index)}>
            <div className="faq-question">
              <span>{faq.q}</span>
              <span className="faq-toggle">{openIndex === index ? '−' : '+'}</span>
            </div>
            {openIndex === index && <div className="faq-answer">{faq.a}</div>}
          </div>
        ))}
      </div>
    </div>
  );
};

export default FAQ;