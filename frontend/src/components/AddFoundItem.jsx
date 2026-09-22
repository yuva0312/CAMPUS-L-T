import React, { useState } from 'react';
import axios from 'axios';

const AddFoundItem = () => {
    const [form, setForm] = useState({
        itemName: '',
        category: '',
        location: '',
        foundDate: '',
    });
    const [imageFile, setImageFile] = useState(null);

    const handleSubmit = async (e) => {
        e.preventDefault();

        const data = new FormData();
        data.append('itemName', form.itemName);
        data.append('category', form.category);
        data.append('location', form.location);
        data.append('foundDate', form.foundDate);

        if (imageFile) {
            data.append('image', imageFile);
        }

        try {
            const token = localStorage.getItem('token');
            await axios.post('http://localhost:5000/api/found-items', data, {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'multipart/form-data',
                },
            });
            alert('Found item reported successfully!');
        } catch (err) {
            console.error('Upload failed:', err.response?.data || err.message);
        }
    };

    return (
        <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            <input
                type="text"
                placeholder="Item Name"
                value={form.itemName}
                onChange={(e) => setForm({ ...form, itemName: e.target.value })}
                required
            />
            <input
                type="text"
                placeholder="Category"
                value={form.category}
                onChange={(e) => setForm({ ...form, category: e.target.value })}
                required
            />
            <input
                type="text"
                placeholder="Location"
                value={form.location}
                onChange={(e) => setForm({ ...form, location: e.target.value })}
                required
            />
            <input
                type="date"
                value={form.foundDate}
                onChange={(e) => setForm({ ...form, foundDate: e.target.value })}
                required
            />
            <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
            />
            <button type="submit">Submit Report</button>
        </form>
    );
};

export default AddFoundItem;