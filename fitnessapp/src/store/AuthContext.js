import React, { createContext, useEffect, useState } from "react";
import AsyncStorage from '@react-native-async-storage/async-storage';

export const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
    const [userToken, setUserToken] = useState(null);
    const [userInfo, setUserInfo] = useState(null);
    const [isLoading, setIsLoading] = useState(true); // Start with true to check auth status
    const [sdt, setSdt] = useState(null);
    const [userRole, setUserRole] = useState(null);

    const login = async (token, user) => {
        try {
            console.log("🔐 AuthContext login - starting");
            console.log("🔐 AuthContext login - token:", token ? "present" : "missing");
            console.log("🔐 AuthContext login - user:", user);

            if (!token) {
                throw new Error("Token is missing");
            }

            if (!user) {
                throw new Error("User info is missing");
            }

            // Đảm bảo user có đầy đủ thông tin cần thiết
            const userRole = user?.vaiTro || 'HoiVien';
            const userSdt = user?.sdt || user?.phone || null;

            console.log("🔐 AuthContext login - setting userRole:", userRole);
            console.log("🔐 AuthContext login - setting userSdt:", userSdt);

            // Tạo user object hoàn chỉnh
            const completeUser = {
                ...user,
                vaiTro: userRole,
                sdt: userSdt
            };

            // Đặt isLoading về false trước khi cập nhật các state khác
            setIsLoading(false);

            // Cập nhật tất cả state cùng một lúc
            setUserToken(token);
            setUserInfo(completeUser);
            setUserRole(userRole);
            setSdt(userSdt);

            // Lưu vào storage
            await AsyncStorage.setItem('userToken', token);
            await AsyncStorage.setItem('userInfo', JSON.stringify(completeUser));

            console.log("✅ AuthContext login - all data set successfully");
            console.log("✅ AuthContext login - final state:", {
                hasToken: !!token,
                hasUser: !!completeUser,
                userRole: userRole,
                userSdt: userSdt
            });

            // Đợi một chút để state được cập nhật hoàn toàn
            await new Promise(resolve => setTimeout(resolve, 100));
        } catch (e) {
            console.error(`❌ AuthContext login error: ${e}`);
            setIsLoading(false); // Đảm bảo tắt loading state ngay cả khi có lỗi
            throw e; // Re-throw để LoginScreen có thể xử lý
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
            console.log("🔍 Starting auth check...");
            setIsLoading(true);

            const userToken = await AsyncStorage.getItem('userToken');
            const userInfo = await AsyncStorage.getItem('userInfo');

            console.log("🔍 Stored data:", { hasToken: !!userToken, hasUserInfo: !!userInfo });

            if (userToken && userInfo) {
                try {
                    const parsedUserInfo = JSON.parse(userInfo);
                    console.log("🔍 Parsed user data:", parsedUserInfo);

                    // Set user data trước, sau đó kiểm tra token
                    setUserToken(userToken);
                    setUserInfo(parsedUserInfo);
                    setUserRole(parsedUserInfo?.vaiTro || null);
                    setSdt(parsedUserInfo?.sdt || null);

                    console.log("🔍 User data set, checking token validity...");

                    // Kiểm tra token có hợp lệ không (không bắt lỗi để tránh block)
                    try {
                        // Import apiService carefully — support both CommonJS require and ES module default
                        let apiService = require('../api/apiService');
                        if (apiService && apiService.default) apiService = apiService.default;
                        // Fallback to dynamic import if require fails to provide the default
                        if (!apiService || !apiService.isLoggedIn) {
                            const imported = await import('../api/apiService');
                            apiService = imported && imported.default ? imported.default : imported;
                        }

                        const isValid = await Promise.race([
                            apiService.isLoggedIn(),
                            new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout')), 3000))
                        ]);

                        if (!isValid) {
                            console.log("❌ Token invalid, clearing data");
                            // Token expired or invalid, clearing storage
                            await AsyncStorage.removeItem('userToken');
                            await AsyncStorage.removeItem('userInfo');
                            setUserToken(null);
                            setUserInfo(null);
                            setUserRole(null);
                            setSdt(null);
                        } else {
                            console.log("✅ Token valid, user logged in");
                        }
                    } catch (apiError) {
                        console.log("⚠️ API check failed, keeping stored data:", apiError.message);
                        // Nếu API check thất bại, giữ data đã lưu
                    }
                } catch (parseError) {
                    console.error("❌ Error parsing userInfo:", parseError);
                    // Error parsing userInfo, clear invalid data
                    await AsyncStorage.removeItem('userToken');
                    await AsyncStorage.removeItem('userInfo');
                    setUserToken(null);
                    setUserInfo(null);
                    setUserRole(null);
                    setSdt(null);
                }
            } else {
                console.log("🔍 No stored user data found");
                // No stored data
                setUserToken(null);
                setUserInfo(null);
                setUserRole(null);
                setSdt(null);
            }
        } catch (e) {
            console.error(`❌ Error checking login status: ${e}`);
            // On error, assume not logged in
            setUserToken(null);
            setUserInfo(null);
            setUserRole(null);
            setSdt(null);
        } finally {
            console.log("🔍 Auth check completed, setting isLoading to false");
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