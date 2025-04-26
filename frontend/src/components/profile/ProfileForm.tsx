// src/components/profile/ProfileForm.tsx
import React, { useState } from 'react';
import { Form, Button, Row, Col, Card } from 'react-bootstrap';
import { UserProfile, defaultUserProfile } from '../../types/UserProfile';

interface ProfileFormProps {
  initialProfile?: UserProfile;
  onSave: (profile: UserProfile) => void;
  isSaving?: boolean;
}

const ProfileForm: React.FC<ProfileFormProps> = ({ 
  initialProfile = defaultUserProfile, 
  onSave,
  isSaving = false
}) => {
  const [profile, setProfile] = useState<UserProfile>(initialProfile);
  const [newCondition, setNewCondition] = useState<string>('');
  const [newMedication, setNewMedication] = useState<string>('');
  const [newAllergy, setNewAllergy] = useState<string>('');

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: value });
  };

  const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setProfile({ ...profile, [name]: parseInt(value) || 0 });
  };

  const handleGenderChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setProfile({ ...profile, gender: e.target.value as 'Male' | 'Female' | 'Other' });
  };

  const addCondition = () => {
    if (newCondition.trim()) {
      setProfile({
        ...profile,
        medicalConditions: [...profile.medicalConditions, newCondition.trim()]
      });
      setNewCondition('');
    }
  };

  const removeCondition = (index: number) => {
    const updatedConditions = [...profile.medicalConditions];
    updatedConditions.splice(index, 1);
    setProfile({ ...profile, medicalConditions: updatedConditions });
  };

  const addMedication = () => {
    if (newMedication.trim()) {
      setProfile({
        ...profile,
        medications: [...profile.medications, newMedication.trim()]
      });
      setNewMedication('');
    }
  };

  const removeMedication = (index: number) => {
    const updatedMedications = [...profile.medications];
    updatedMedications.splice(index, 1);
    setProfile({ ...profile, medications: updatedMedications });
  };

  const addAllergy = () => {
    if (newAllergy.trim()) {
      setProfile({
        ...profile,
        allergies: [...profile.allergies, newAllergy.trim()]
      });
      setNewAllergy('');
    }
  };

  const removeAllergy = (index: number) => {
    const updatedAllergies = [...profile.allergies];
    updatedAllergies.splice(index, 1);
    setProfile({ ...profile, allergies: updatedAllergies });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(profile);
  };

  return (
    <Form onSubmit={handleSubmit}>
      <Card className="mb-4">
        <Card.Header>
          <h4>Personal Information</h4>
        </Card.Header>
        <Card.Body>
          <Row>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>First Name</Form.Label>
                <Form.Control
                  type="text"
                  name="firstName"
                  value={profile.firstName}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
            <Col md={6}>
              <Form.Group className="mb-3">
                <Form.Label>Last Name</Form.Label>
                <Form.Control
                  type="text"
                  name="lastName"
                  value={profile.lastName}
                  onChange={handleInputChange}
                  required
                />
              </Form.Group>
            </Col>
          </Row>

          <Row>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Age</Form.Label>
                <Form.Control
                  type="number"
                  name="age"
                  value={profile.age || ''}
                  onChange={handleNumberChange}
                  min="0"
                  max="120"
                  required
                />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Gender</Form.Label>
                <Form.Select 
                  value={profile.gender} 
                  onChange={handleGenderChange}
                  required
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Other">Other</option>
                </Form.Select>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group className="mb-3">
                <Form.Label>Max Travel Distance (miles)</Form.Label>
                <Form.Control
                  type="number"
                  name="maxTravelDistance"
                  value={profile.maxTravelDistance}
                  onChange={handleNumberChange}
                  min="0"
                  max="1000"
                />
              </Form.Group>
            </Col>
          </Row>

          <Form.Group className="mb-3">
            <Form.Label>Location (City, State)</Form.Label>
            <Form.Control
              type="text"
              name="location"
              value={profile.location}
              onChange={handleInputChange}
              required
              placeholder="e.g., Boston, MA"
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Contact Email</Form.Label>
            <Form.Control
              type="email"
              name="contactEmail"
              value={profile.contactEmail}
              onChange={handleInputChange}
              required
            />
          </Form.Group>

          <Form.Group className="mb-3">
            <Form.Label>Contact Phone (optional)</Form.Label>
            <Form.Control
              type="tel"
              name="contactPhone"
              value={profile.contactPhone || ''}
              onChange={handleInputChange}
            />
          </Form.Group>
        </Card.Body>
      </Card>

      <Card className="mb-4">
        <Card.Header>
          <h4>Medical Information</h4>
        </Card.Header>
        <Card.Body>
          <Form.Group className="mb-4">
            <Form.Label>Medical Conditions</Form.Label>
            <div className="d-flex mb-2">
              <Form.Control
                type="text"
                value={newCondition}
                onChange={(e) => setNewCondition(e.target.value)}
                placeholder="Type a condition and click Add"
              />
              <Button variant="outline-primary" onClick={addCondition} className="ms-2">
                Add
              </Button>
            </div>
            <div className="condition-tags">
              {profile.medicalConditions.map((condition, index) => (
                <span key={index} className="badge bg-info me-2 mb-2 p-2">
                  {condition}
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    aria-label="Remove"
                    onClick={() => removeCondition(index)}
                    style={{ fontSize: '0.5rem' }}
                  ></button>
                </span>
              ))}
              {profile.medicalConditions.length === 0 && (
                <p className="text-muted">No conditions added yet.</p>
              )}
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Current Medications</Form.Label>
            <div className="d-flex mb-2">
              <Form.Control
                type="text"
                value={newMedication}
                onChange={(e) => setNewMedication(e.target.value)}
                placeholder="Type a medication and click Add"
              />
              <Button variant="outline-primary" onClick={addMedication} className="ms-2">
                Add
              </Button>
            </div>
            <div className="medication-tags">
              {profile.medications.map((medication, index) => (
                <span key={index} className="badge bg-secondary me-2 mb-2 p-2">
                  {medication}
                  <button
                    type="button"
                    className="btn-close btn-close-white ms-2"
                    aria-label="Remove"
                    onClick={() => removeMedication(index)}
                    style={{ fontSize: '0.5rem' }}
                  ></button>
                </span>
              ))}
              {profile.medications.length === 0 && (
                <p className="text-muted">No medications added yet.</p>
              )}
            </div>
          </Form.Group>

          <Form.Group className="mb-4">
            <Form.Label>Allergies</Form.Label>
            <div className="d-flex mb-2">
              <Form.Control
                type="text"
                value={newAllergy}
                onChange={(e) => setNewAllergy(e.target.value)}
                placeholder="Type an allergy and click Add"
              />
              <Button variant="outline-primary" onClick={addAllergy} className="ms-2">
                Add
              </Button>
            </div>
            <div className="allergy-tags">
              {profile.allergies.map((allergy, index) => (
                <span key={index} className="badge bg-warning text-dark me-2 mb-2 p-2">
                  {allergy}
                  <button
                    type="button"
                    className="btn-close ms-2"
                    aria-label="Remove"
                    onClick={() => removeAllergy(index)}
                    style={{ fontSize: '0.5rem' }}
                  ></button>
                </span>
              ))}
              {profile.allergies.length === 0 && (
                <p className="text-muted">No allergies added yet.</p>
              )}
            </div>
          </Form.Group>
        </Card.Body>
      </Card>

      <div className="d-flex justify-content-end">
        <Button type="submit" variant="primary" disabled={isSaving}>
          {isSaving ? 'Saving...' : 'Save Profile'}
        </Button>
      </div>
    </Form>
  );
};

export default ProfileForm;