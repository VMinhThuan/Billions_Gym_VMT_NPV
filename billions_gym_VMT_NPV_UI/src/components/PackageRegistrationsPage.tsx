import React from 'react';
import PackageRegistrationManager from './PackageRegistrationManager';
import './PackageRegistrationManager.css';

// Package Registrations Management Page
const PackageRegistrationsPage = () => {
    return (
        <div className="package-registrations-page">
            <PackageRegistrationManager mode="admin-stats" />
        </div>
    );
};

export default PackageRegistrationsPage;
