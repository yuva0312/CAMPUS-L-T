import React, { useState } from 'react';
import axios from 'axios';

const ClaimForm = ({ foundItemId, matchId, lostItemId }) => {
    const [formData, setFormData] = useState({
        brand: '',
        colour: '',
        lostLocation: '',
        lostDateAndTime: '',
        uniqueMark: '',
        additionalFeature: '',
    });
    const [proofImage, setProofImage] = useState(null);
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState({ type: '', text: '' });

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files && e.target.files[0]) {
            setProofImage(e.target.files[0]);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setMessage({ type: '', text: '' });

        try {
            // Create Multipart FormData payload
            const data = new FormData();
            data.append('foundItemId', foundItemId);
            if (matchId) data.append('matchId', matchId);
            if (lostItemId) data.append('lostItemId', lostItemId);

            // Stringify object for backend JSON parsing
            data.append('verificationAnswers', JSON.stringify(formData));

            // Append proof image file if selected
            if (proofImage) {
                data.append('proofImage', proofImage);
            }

            const token = localStorage.getItem('token'); // Retrieve auth token
            const response = await axios.post('/api/claims', data, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                    Authorization: `Bearer ${token}`,
                },
            });

            setMessage({
                type: 'success',
                text: response.data.message || 'Claim submitted successfully!',
            });

            // Reset form on success
            setFormData({
                brand: '',
                colour: '',
                lostLocation: '',
                lostDateAndTime: '',
                uniqueMark: '',
                additionalFeature: '',
            });
            setProofImage(null);
        } catch (error) {
            setMessage({
                type: 'error',
                text: error.response?.data?.message || 'Error submitting claim. Please try again.',
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="claim-form-container">
            <h2>Submit Verification Claim</h2>

            {message.text && (
                <div className={`alert ${message.type === 'success' ? 'alert-success' : 'alert-danger'}`}>
                    {message.text}
                </div>
            )}

            <form onSubmit={handleSubmit} Date-testid="claim-form">
                <div className="form-group">
                    <label>Item Brand *</label>
                    <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Item Colour *</label>
                    <input
                        type="text"
                        name="colour"
                        value={formData.colour}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Lost Location *</label>
                    <input
                        type="text"
                        name="lostLocation"
                        value={formData.lostLocation}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Date & Time Lost *</label>
                    <input
                        type="text"
                        name="lostDateAndTime"
                        value={formData.lostDateAndTime}
                        onChange={handleInputChange}
                        required
                    />
                </div>

                <div className="form-group">
                    <label>Unique Identification Mark / Engraving</label>
                    <input
                        type="text"
                        name="uniqueMark"
                        value={formData.uniqueMark}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label>Additional Features / Damage Details</label>
                    <textarea
                        name="additionalFeature"
                        value={formData.additionalFeature}
                        onChange={handleInputChange}
                    />
                </div>

                <div className="form-group">
                    <label>Upload Proof Photo (Receipt / Photo with item)</label>
                    <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                    />
                </div>

                <button type="submit" disabled={loading}>
                    {loading ? 'Submitting Claim...' : 'Submit Claim'}
                </button>
            </form>
        </div>
    );
};

export default ClaimForm;