import React from 'react';
import Header from './Header';
import Footer from './Footer';

const Layout = ({ children, onNavigateToLogin, onNavigateToRegister }) => {
    return (
        <>
            <div className="min-h-screen flex flex-col">
                <Header onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister} />
                <main className="flex-1 bg-black pt-20">
                    {children}
                </main>
                <Footer />
            </div>
        </>
    );
};

export default Layout;