import React from 'react';
import { useLanguage } from '../../contexts/LanguageContext';

const Footer = () => {
    const { content } = useLanguage();

    return (
        <footer className="bg-[#141414] text-white">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    <div className="col-span-1 md:col-span-2">
                        <h3 className="text-3xl text-white font-semibold mb-4">Billions Gym</h3>
                        <p className="text-gray-300 mb-4">
                            {content.footerTagline}
                        </p>
                        <p className="text-gray-300 mb-4">
                            {content.footerDescription}
                        </p>
                        <div className="flex items-center space-x-4">
                            <a href="#" className="text-gray-300 hover:text-white flex items-center justify-center">
                                <span className="sr-only">Facebook</span>
                                <svg
                                    fill="#ffffff"
                                    height="24"
                                    width="24"
                                    viewBox="-337 273 123.5 256"
                                    xmlns="http://www.w3.org/2000/svg"
                                >
                                    <path d="M-260.9,327.8c0-10.3,9.2-14,19.5-14c10.3,0,21.3,3.2,21.3,3.2l6.6-39.2c0,0-14-4.8-47.4-4.8c-20.5,0-32.4,7.8-41.1,19.3 c-8.2,10.9-8.5,28.4-8.5,39.7v25.7H-337V396h26.5v133h49.6V396h39.3l2.9-38.3h-42.2V327.8z" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white flex items-center justify-center">
                                <span className="sr-only">Twitter</span>
                                <svg className="h-6 w-6" fill="#ffffff" viewBox="0 0 24 24">
                                    <path d="M24 4.557c-.883.392-1.832.656-2.828.775 1.017-.609 1.798-1.574 2.165-2.724-.951.564-2.005.974-3.127 1.195-.897-.957-2.178-1.555-3.594-1.555-3.179 0-5.515 2.966-4.797 6.045-4.091-.205-7.719-2.165-10.148-5.144-1.29 2.213-.669 5.108 1.523 6.574-.806-.026-1.566-.247-2.229-.616-.054 2.281 1.581 4.415 3.949 4.89-.693.188-1.452.232-2.224.084.626 1.956 2.444 3.379 4.6 3.419-2.07 1.623-4.678 2.348-7.29 2.04 2.179 1.397 4.768 2.212 7.548 2.212 9.142 0 14.307-7.721 13.995-14.646.962-.695 1.797-1.562 2.457-2.549z" />
                                </svg>
                            </a>
                            <a href="#" className="text-gray-300 hover:text-white flex items-center justify-center">
                                <span className="sr-only">Instagram</span>
                                <svg
                                    fill="#ffffff"
                                    viewBox="0 0 32 32"
                                    xmlns="http://www.w3.org/2000/svg"
                                    width="40"
                                    height="40"
                                    aria-hidden="true"
                                >
                                    <g>
                                        <path d="M20.445 5h-8.891A6.559 6.559 0 0 0 5 11.554v8.891A6.559 6.559 0 0 0 11.554 27h8.891a6.56 6.56 0 0 0 6.554-6.555v-8.891A6.557 6.557 0 0 0 20.445 5zm4.342 15.445a4.343 4.343 0 0 1-4.342 4.342h-8.891a4.341 4.341 0 0 1-4.341-4.342v-8.891a4.34 4.34 0 0 1 4.341-4.341h8.891a4.342 4.342 0 0 1 4.341 4.341l.001 8.891z" />
                                        <path d="M16 10.312c-3.138 0-5.688 2.551-5.688 5.688s2.551 5.688 5.688 5.688 5.688-2.551 5.688-5.688-2.55-5.688-5.688-5.688zm0 9.163a3.475 3.475 0 1 1-.001-6.95 3.475 3.475 0 0 1 .001 6.95zM21.7 8.991a1.363 1.363 0 1 1-1.364 1.364c0-.752.51-1.364 1.364-1.364z" />
                                    </g>
                                </svg>
                            </a>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                            {content.quickLinks}
                        </h4>
                        <ul className="space-y-2">
                            <li><a href="#" className="text-gray-300 hover:text-white">{content.footerAbout}</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white">{content.classes}</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white">{content.trainers}</a></li>
                            <li><a href="#" className="text-gray-300 hover:text-white">{content.members}</a></li>
                        </ul>
                    </div>

                    {/* Contact */}
                    <div>
                        <h4 className="text-sm font-semibold text-gray-300 uppercase tracking-wider mb-4">
                            {content.contact}
                        </h4>
                        <ul className="space-y-2 text-gray-300">
                            <li>{content.address}</li>
                            <li>{content.phone}</li>
                            <li>{content.footerEmail}</li>
                        </ul>
                    </div>
                </div>

                <div className="mt-8 pt-8 border-t border-gray-400">
                    <p className="text-center text-gray-300">
                        {content.copyright}
                    </p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
