import 'bootstrap/dist/css/bootstrap.min.css';
import React from 'react';
import logo from './logo.svg';
import { Container, Nav, Navbar, Tab, Tabs } from 'react-bootstrap';
import TrialMatching from './components/trial-matching/TrialMatching';
import './App.css';

function App() {
  return (
    <div className="App">
      <Navbar bg="dark" variant="dark" expand="lg">
        <Container>
          <Navbar.Brand href="#home">ClinCrush</Navbar.Brand>
          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link href="#home">Home</Nav.Link>
              <Nav.Link href="#matches">My Matches</Nav.Link>
              <Nav.Link href="#profile">Profile</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      
      <Container className="mt-4">
        <Tabs defaultActiveKey="match" id="main-tabs" className="mb-4">
          <Tab eventKey="match" title="Trial Matching">
            <TrialMatching />
          </Tab>
          <Tab eventKey="matches" title="My Matches">
            <div className="p-4 text-center">
              <h3>My Matched Trials</h3>
              <p>This tab will show trials you've matched with.</p>
            </div>
          </Tab>
          <Tab eventKey="profile" title="My Profile">
            <div className="p-4 text-center">
              <h3>My Profile</h3>
              <p>This tab will contain your health profile and preferences.</p>
            </div>
          </Tab>
        </Tabs>
      </Container>
    </div>
  );
}

export default App;