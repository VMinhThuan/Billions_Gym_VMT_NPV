import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true);
    const [sdt, setSdt] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const login = async (token, user) => {
        try {
            if (!token) {
                throw new Error("Token is missing");
            }

            if (!user) {
                throw new Error("User info is missing");
            }

            const userRole = user?.vaiTro || 'HoiVien';
            const userSdt = user?.sdt || user?.phone || null;

            const completeUser = {
                ...user,
                vaiTro: userRole,
                sdt: userSdt
            };

            setIsLoading(false);

            setUserToken(token);
            setUserInfo(completeUser);
            setUserRole(userRole);
            setSdt(userSdt);

            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(completeUser));

            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
            console.error(`AuthContext login error: ${e}`);
            setIsLoading(false);
            throw e;
        }
    };

    const logout = async () => {
        try {
            setIsLoading(true);
            setUserToken(null);
            setUserInfo(null);
            setUserRole(null);
            setSdt(null);
            await AsyncStorage.removeItem('userToken');
            await AsyncStorage.removeItem('userInfo');
        } catch (e) {
            console.error(`Logout error: ${e}`);
        } finally {
            setIsLoading(false);
        }
    };

    const isLoggedIn = async () => {
        try {
            setIsLoading(true);

            const userToken = await AsyncStorage.getItem('userToken');
            const userInfo = await AsyncStorage.getItem('userInfo');

            if (userToken && userInfo) {
                try {
                    const parsedUserInfo = JSON.parse(userInfo);

                    setUserToken(userToken);
                    setUserInfo(parsedUserInfo);
                    setUserRole(parsedUserInfo?.vaiTro || null);
                    setSdt(parsedUserInfo?.sdt || null);

                    try {
                        let apiService = require('../api/apiService');
                        if (apiService && apiService.default) apiService = apiService.default;
                        if (!apiService || !apiService.isLoggedIn) {
                            const imported = await import('../api/apiService');
                            apiService = imported && imported.default ? imported.default : imported;
                        }

                        const isValid = await Promise.race([
                            apiService.isLoggedIn(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                        ]);

                        if (!isValid) {
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userInfo');
                            setUserToken(null);
                            setUserInfo(null);
                            setUserRole(null);
                            setSdt(null);
                        } else {
                            setUserToken(userToken);
                            setUserInfo(parsedUserInfo);
                            setUserRole(parsedUserInfo?.vaiTro || null);
                            setSdt(parsedUserInfo?.sdt || null);
                        }
                    } catch (apiError) {
                        console.error("API check failed, keeping stored data:", apiError.message);
                        setUserToken(userToken);
                        setUserInfo(parsedUserInfo);
                        setUserRole(parsedUserInfo?.vaiTro || null);
                        setSdt(parsedUserInfo?.sdt || null);
                    }
                } catch (parseError) {
                    console.error("Error parsing userInfo:", parseError);
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userInfo');
                    setUserToken(null);
                    setUserInfo(null);
                    setUserRole(null);
                    setSdt(null);
                }
            } else {
                setUserToken(null);
                setUserInfo(null);
                setUserRole(null);
                setSdt(null);
            }
        } catch (e) {
            console.error(`Error checking login status: ${e}`);
            setUserToken(null);
            setUserInfo(null);
            setUserRole(null);
            setSdt(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        isLoggedIn();
    }, []);

    return (
        <AuthContext.Provider value={{ login, logout, isLoading, userToken, userInfo, userRole, sdt, setSdt }}>
            {children}
        </AuthContext.Provider>
    );
};