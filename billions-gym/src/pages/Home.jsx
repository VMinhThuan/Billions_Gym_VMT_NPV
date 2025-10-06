import React from 'react';
import Layout from '../components/layout/Layout';
import { useLanguage } from '../contexts/LanguageContext';

const Home = ({ onNavigateToLogin, onNavigateToRegister }) => {
    const { content } = useLanguage();

    return (
        <>
            <Layout onNavigateToLogin={onNavigateToLogin} onNavigateToRegister={onNavigateToRegister}>
                <div className="container mx-auto mt-40 py-16">
                    <div className="text-center">
                        <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 animate-fadeInUp" style={{ animationDelay: '0ms' }}>
                            {content.welcomeMessage}
                        </h1>
                        <p className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto animate-fadeInUp" style={{ animationDelay: '100ms' }}>
                            {content.homeDescription}
                        </p>
                        <div className="flex flex-col sm:flex-row gap-4 justify-center">
                            <button className="bg-[#da2128] hover:bg-[#b91c1c] text-white px-8 py-3 rounded-lg font-medium transition-colors animate-fadeInUp cursor-pointer" style={{ animationDelay: '200ms' }}>
                                {content.getStarted}
                            </button>
                            <button className="border border-white text-white hover:bg-white hover:text-black px-8 py-3 rounded-lg font-medium transition-colors animate-fadeInUp cursor-pointer" style={{ animationDelay: '300ms' }}>
                                {content.learnMore}
                            </button>
                        </div>
                    </div>
                </div>
            </Layout>
        </>
    );
};

export default Home;
