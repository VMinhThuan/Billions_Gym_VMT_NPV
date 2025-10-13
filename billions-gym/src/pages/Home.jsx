import React from 'react';
import Layout from '../components/layout/Layout';

const Home = ({ onNavigateToLogin, onNavigateToRegister }) => {
    return (
        <Layout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
            {/* Layout component đã chứa tất cả nội dung Home */}
        </Layout>
    );
};

export default Home;
