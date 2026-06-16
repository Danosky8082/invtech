import React, { useState } from 'react';

const Contact = () => {
  const [formData, setFormData] = useState({ name: '', email: '', subject: '', message: '' });
  const [submitted, setSubmitted] = useState(false);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // For now, just log and show success
    console.log('Contact form submitted:', formData);
    setSubmitted(true);
    // You can integrate with a backend email service later
  };

  return (
    <div className="contact-container">
      <h1>📬 Contact Us</h1>
      <p>Have questions or feedback? Reach out to us!</p>

      {submitted ? (
        <div className="success-message">
          ✅ Thank you! Your message has been sent. We'll get back to you soon.
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="contact-form">
          <div className="form-group">
            <label>Name *</label>
            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input type="email" name="email" value={formData.email} onChange={handleChange} required />
          </div>
          <div className="form-group">
            <label>Subject</label>
            <input type="text" name="subject" value={formData.subject} onChange={handleChange} />
          </div>
          <div className="form-group">
            <label>Message *</label>
            <textarea name="message" rows="5" value={formData.message} onChange={handleChange} required></textarea>
          </div>
          <button type="submit" className="submit-btn">Send Message</button>
        </form>
      )}

      <div className="contact-info">
        <p>📧 Email: <a href="mailto:support@invtech.com">support@invtech.com</a></p>
        <p>📍 Headquarters: Lagos, Nigeria</p>
      </div>
    </div>
  );
};

export default Contact;