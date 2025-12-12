import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { authUtils } from '../../utils/auth';
import { getApiUrl, getAuthHeaders } from '../../services/api';

const Sidebar = ({ isOpen, onClose }) => {
    const navigate = useNavigate();
    const location = useLocation();
    const localUser = authUtils.getUser();

    const [apiUser, setApiUser] = useState(null);
    const [isLoadingUser, setIsLoadingUser] = useState(false);
    const [collapsed, setCollapsed] = useState(false);

    // Fetch user profile
    useEffect(() => {
        const fetchUserProfile = async () => {
            if (!localUser?._id) return;

            setIsLoadingUser(true);
            try {
                const response = await fetch(getApiUrl('/user/profile'), {
                    method: 'GET',
                    headers: getAuthHeaders(true)
                });

                if (!response.ok) {
                    throw new Error('Failed to fetch user profile');
                }

                const result = await response.json();
                console.log('API User Profile Response:', result);

                if (result.success && result.data) {
                    setApiUser(result.data);
                }
            } catch (error) {
                console.error('Error fetching user profile:', error);
                setApiUser(null);
                setApiUser(localUser);
            } finally {
                setIsLoadingUser(false);
            }
        };

        fetchUserProfile();
    }, [localUser?._id]);

    const user = apiUser || localUser;

    const menuItems = [
        {
            id: 'home',
            label: 'Trang chủ',
            icon: 'home',
            path: '/home',
            description: 'Xem tổng quan về tài khoản'
        },
        {
            id: 'active-package',
            label: 'Gói tập hiện tại',
            icon: 'package',
            path: '/active-package',
            description: 'Thông tin gói tập đang sử dụng'
        },
        {
            id: 'schedule',
            label: 'Lịch tập',
            icon: 'calendar',
            path: '/schedule',
            description: 'Xem lịch tập cá nhân'
        },
        {
            id: 'checkin',
            label: 'Check-in/Check-out',
            icon: 'camera',
            path: '/checkin-out',
            description: 'Check-in và check-out buổi tập'
        },
        {
            id: 'workouts',
            label: 'Buổi tập',
            icon: 'activity',
            path: '/workouts',
            description: 'Xem video và bài tập theo playlist'
        },
        {
            id: 'chat-with-pt',
            label: 'Chat với PT',
            icon: 'message',
            path: '/chat-with-pt',
            description: 'Chat với PT phụ trách buổi tập của bạn'
        },
        {
            id: 'nutrition',
            label: 'Dinh dưỡng',
            icon: 'nutrition',
            path: '/nutrition',
            description: 'Gợi ý thực đơn và dinh dưỡng'
        },
        {
            id: 'my-meals',
            label: 'Bữa ăn của tôi',
            icon: 'plate',
            path: '/my-meals',
            description: 'Quản lý thực đơn hàng ngày'
        },
        {
            id: 'body-metrics',
            label: 'Chỉ số cơ thể',
            icon: 'body-index',
            path: '/body-metrics',
            description: 'Theo dõi chỉ số sức khỏe'
        },
        // {
        //     id: 'payments',
        //     label: 'Thanh toán',
        //     icon: 'credit-card',
        //     path: '/payments',
        //     description: 'Lịch sử thanh toán'
        // },
        // {
        //     id: 'reviews',
        //     label: 'Đánh giá',
        //     icon: 'star',
        //     path: '/reviews',
        //     description: 'Đánh giá trải nghiệm'
        // },
    ];

    const getIcon = (iconName) => {
        const icons = {
            user: (
                <svg fill='currentColor' className='w-5 h-5' stroke='currentColor' xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640"><path d="M341.8 72.6C329.5 61.2 310.5 61.2 298.3 72.6L74.3 280.6C64.7 289.6 61.5 303.5 66.3 315.7C71.1 327.9 82.8 336 96 336L112 336L112 512C112 547.3 140.7 576 176 576L464 576C499.3 576 528 547.3 528 512L528 336L544 336C557.2 336 569 327.9 573.8 315.7C578.6 303.5 575.4 289.5 565.8 280.6L341.8 72.6zM304 384L336 384C362.5 384 384 405.5 384 432L384 528L256 528L256 432C256 405.5 277.5 384 304 384z" /></svg>
            ),
            package: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
            ),
            'plus-circle': (
                <svg className='w-5 h-5' fill="none" stroke='currentColor' viewBox="0 0 16 16" id="register-16px" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier">
                    <path id="Path_184" data-name="Path 184" d="M57.5,41a.5.5,0,0,0-.5.5V43H47V31h2v.5a.5.5,0,0,0,.5.5h5a.5.5,0,0,0,.5-.5V31h2v.5a.5.5,0,0,0,1,0v-1a.5.5,0,0,0-.5-.5H55v-.5A1.5,1.5,0,0,0,53.5,28h-3A1.5,1.5,0,0,0,49,29.5V30H46.5a.5.5,0,0,0-.5.5v13a.5.5,0,0,0,.5.5h11a.5.5,0,0,0,.5-.5v-2A.5.5,0,0,0,57.5,41ZM50,29.5a.5.5,0,0,1,.5-.5h3a.5.5,0,0,1,.5.5V31H50Zm11.854,4.646-2-2a.5.5,0,0,0-.708,0l-6,6A.5.5,0,0,0,53,38.5v2a.5.5,0,0,0,.5.5h2a.5.5,0,0,0,.354-.146l6-6A.5.5,0,0,0,61.854,34.146ZM54,40V38.707l5.5-5.5L60.793,34.5l-5.5,5.5Zm-2,.5a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1,0-1h2A.5.5,0,0,1,52,40.5Zm0-3a.5.5,0,0,1-.5.5h-2a.5.5,0,0,1,0-1h2A.5.5,0,0,1,52,37.5ZM54.5,35h-5a.5.5,0,0,1,0-1h5a.5.5,0,0,1,0,1Z" transform="translate(-46 -28)"></path> </g>
                </svg>
            ),
            calendar: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
            ),
            activity: (
                <svg fill="currentColor" className='w-5 h-5' version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 512 512" xmlSpace="preserve" stroke="currentColor"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g>
                    <path d="M255.969,0c-23.748,0-42.999,19.251-42.999,42.999c-0.001,14.411,7.095,27.157,17.977,34.959h50.044 c10.881-7.803,17.977-20.548,17.977-34.959C298.968,19.251,279.717,0,255.969,0z"></path> </g> </g> <g> <g> <path d="M449.551,94.91h-10.988c0-20.553,0-16.112,0-36.795c0-3.805-3.085-6.889-6.889-6.889h-18.821 c-3.805,0-6.889,3.085-6.889,6.889c0,20.683,0,16.239,0,36.795h-24.059c1.003-10.538-6.758-19.765-17.038-20.853 c-10.483-1.101-19.944,6.524-21.055,17.028l-0.404,3.826H168.654l-0.404-3.826c-1.108-10.483-10.563-18.142-21.055-17.028 c-10.264,1.085-18.043,10.299-17.039,20.852h-24.118c0-20.553,0-16.112,0-36.795c0-3.805-3.085-6.889-6.889-6.889H80.327 c-3.805,0-6.889,3.085-6.889,6.889c0,20.683,0,16.239,0,36.795H62.451c-7.202,0-13.039,5.838-13.039,13.039 c0,7.202,5.838,13.039,13.039,13.039h10.987c0,20.553,0,16.112,0,36.795c0,3.805,3.085,6.889,6.889,6.889h18.821 c3.805,0,6.889-3.085,6.889-6.889c0-20.683,0-16.239,0-36.795h26.866c0.825,7.803,6.66,62.973,7.523,71.133 c1.696,16.052,21.799,23.28,33.134,10.92c0.105-0.115,0.223-0.216,0.326-0.335l26.91-30.796l0.01,315.191 c0,13.75,11.147,24.896,24.896,24.896c13.749,0,24.896-11.147,24.896-24.896v-199h10.75v199.003 c0,13.75,11.146,24.896,24.896,24.896c13.75,0,24.896-11.147,24.896-24.896c0-3.235-0.451-315.847-0.451-315.847l27.484,31.453 c0.103,0.118,0.218,0.218,0.324,0.333c11.03,12.029,31.386,5.604,33.135-10.918c0.862-8.158,6.698-63.331,7.523-71.133h26.807 c0,20.553,0,16.112,0,36.795c0,3.805,3.085,6.889,6.889,6.889h18.821c3.805,0,6.889-3.085,6.889-6.889c0-20.683,0-16.239,0-36.795 h10.988c7.203,0,13.039-5.838,13.039-13.039C462.589,100.75,456.752,94.91,449.551,94.91z M338.856,137.942 c-4.705,0-153.328,0-165.651,0l-1.793-16.953h169.236L338.856,137.942z"></path> </g> </g> </g>
                </svg>
            ),
            'barbell': (
                <svg xmlns="http://www.w3.org/2000/svg" className='w-5 h-5' viewBox="0 0 48 48" fill="currentColor" aria-hidden="true">
                    <path d="M32 14h4v20h-4v-9H16v9h-4V14h4v9h16v-9ZM6 23v-6h4v14H6v-6H4v-2h2Zm38 2h-2v6h-4V17h4v6h2v2Z" fillRule="evenodd" clipRule="evenodd" />
                </svg>
            ),
            nutrition: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-5 h-5"
                    fill="currentColor"
                >
                    <g>
                        <path d="M83.344,19.781C37.313,19.781,0,65.844,0,117.828c0,31.641,14.875,59.547,33.063,76.906 C49.031,210,58.828,221.75,60.781,247.25v244.969h45.109V247.25c1.953-25.5,11.766-37.25,27.734-52.516 c18.188-17.359,33.063-45.266,33.063-76.906C166.688,65.844,129.359,19.781,83.344,19.781z" />
                        <path d="M328.391,54.188v89c0,5.688-4.609,10.297-10.297,10.297h-2.75c-5.688,0-10.297-4.609-10.297-10.297V53.781 c0-14.688-9.859-19.063-19.328-19.063s-19.344,4.375-19.344,19.063v89.406c0,5.688-4.609,10.297-10.281,10.297h-2.75 c-5.688,0-10.281-4.609-10.281-10.297v-89c0-26.281-37.469-25.375-37.469,0.281c0,30.719,0,84.984,0,84.984 c-0.156,47.219,11.109,59.453,29.75,74.172c15,11.844,27.813,18.641,27.813,48.047v230.547h45.125V261.672 c0-29.406,12.813-36.203,27.813-48.047c18.625-14.719,29.906-26.953,29.734-74.172c0,0,0-54.266,0-84.984 C365.828,28.813,328.391,27.906,328.391,54.188z" />
                        <path d="M454.672,63.047c-8.172,27.297-32.75,90.063-38.891,145.344c-6.125,55.266,22.531,73.688,40.938,104.391 l10.172,25.609v153.828h44.891H512c0-7.547,0-138.297,0-230.031c0-90.766,0-183.203,0-199.141 C512,30.281,466.969,22.094,454.672,63.047z" />
                    </g>
                </svg>
            ),
            plate: (
                <svg
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 512 512"
                    className="w-5 h-5"
                    fill="currentColor"
                >
                    <path d="M256 0C114.6 0 0 114.6 0 256s114.6 256 256 256 256-114.6 256-256S397.4 0 256 0zm0 448c-106 0-192-86-192-192S150 64 256 64s192 86 192 192-86 192-192 192z" />
                    <circle cx="256" cy="256" r="96" />
                </svg>
            ),

            'body-index': (
                <svg fill="currentColor" className='w-5 h-5' stroke='currentColor' version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 496 496" xmlSpace="preserve"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <g> <path d="M248,136c13.232,0,24-10.768,24-24c0-10.416-6.712-19.216-16-22.528V32h-16v57.472c-9.296,3.312-16,12.112-16,22.528 C224,125.232,234.768,136,248,136z M248,104c4.416,0,8,3.584,8,8s-3.584,8-8,8s-8-3.584-8-8S243.584,104,248,104z"></path> <path d="M448,248h-2.848l2.432-20.16c0.272-2.232,0.416-4.48,0.416-6.736V152c0-30.872-25.128-56-56-56h-33.28 C350.92,41.816,304.312,0,248,0S145.08,41.816,137.28,96H104c-30.872,0-56,25.128-56,56v69.104c0,2.256,0.144,4.512,0.408,6.736 l2.44,20.16H0v96h62.488l12.448,102.736C78.344,474.824,102.24,496,130.528,496h234.936c28.288,0,52.184-21.176,55.592-49.264 l2.76-22.736H448c26.472,0,48-21.528,48-48v-80C496,269.528,474.472,248,448,248z M248,16c52.936,0,96,43.064,96,96 c0,52.936-43.064,96-96,96c-52.936,0-96-43.064-96-96C152,59.064,195.064,16,248,16z M64,152c0-22.056,17.944-40,40-40h32 c0,61.76,50.24,112,112,112s112-50.24,112-112h32c22.056,0,40,17.944,40,40v69.104c0,1.6-0.096,3.208-0.296,4.816L429.032,248 H66.968l-2.68-22.096c-0.192-1.592-0.288-3.2-0.288-4.8V152z M405.168,444.816C402.744,464.872,385.672,480,365.472,480H130.528 c-20.2,0-37.272-15.128-39.704-35.184L78.608,344h338.784L405.168,444.816z M448,408h-22.24l7.76-64H448 c17.648,0,32,14.352,32,32S465.648,408,448,408z M480,340.248C471.496,332.64,460.28,328,448,328H16v-64h16v16h16v-16h16v16h16 v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16v16h16v-16h16 v16h16v-16h16v16h16v-16h16v24h16v-19.552c9.52,5.552,16,15.76,16,27.552V340.248z"></path> </g> </g> </g> </g></svg>
            ),
            'credit-card': (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                </svg>
            ),
            bell: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
            ),
            star: (
                <svg fill="currentColor" className='w-5 h-5' stroke='currentColor' version="1.1" id="Layer_1" xmlns="http://www.w3.org/2000/svg" xmlnsXlink="http://www.w3.org/1999/xlink" viewBox="0 0 491.52 491.52" xmlSpace="preserve"><g id="SVGRepo_bgCarrier" strokeWidth="0"></g><g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g><g id="SVGRepo_iconCarrier"> <g> <g> <path d="M163.34,59.006c-1.065-3.28-3.715-5.805-7.045-6.715L114.34,40.836L90.48,4.476c-3.78-5.77-13.34-5.77-17.12,0 l-23.855,36.36L7.545,52.291c-3.33,0.91-5.98,3.435-7.045,6.715c-1.065,3.285-0.405,6.88,1.75,9.57l27.215,33.93l-2.075,43.44 c-0.165,3.45,1.42,6.745,4.21,8.775c1.775,1.29,3.89,1.955,6.02,1.955c1.22,0,2.45-0.22,3.625-0.665l40.675-15.395l40.68,15.395 c3.225,1.225,6.855,0.74,9.645-1.29c2.79-2.03,4.375-5.325,4.21-8.775l-2.075-43.44l27.21-33.93 C163.745,65.886,164.405,62.286,163.34,59.006z M115.975,92.716c-1.56,1.945-2.355,4.4-2.24,6.895l1.515,31.725l-29.705-11.245 c-1.17-0.445-2.395-0.665-3.625-0.665c-1.23,0-2.455,0.22-3.625,0.665l-29.7,11.24l1.515-31.72c0.12-2.495-0.68-4.95-2.24-6.895 L27.995,67.941l30.64-8.365c2.41-0.66,4.495-2.175,5.865-4.265l17.42-26.55l17.425,26.55c1.37,2.09,3.455,3.605,5.865,4.265 l30.635,8.365L115.975,92.716z"></path> </g> </g> <g> <g> <rect x="204.8" y="51.051" width="174.08" height="20.48"></rect> </g> </g> <g> <g> <rect x="204.8" y="102.251" width="286.72" height="20.48"></rect> </g> </g> <g> <g> <path d="M163.34,226.351c-1.07-3.28-3.715-5.805-7.045-6.715l-41.955-11.45l-23.86-36.36c-3.78-5.77-13.34-5.77-17.12,0 l-23.855,36.36l-41.96,11.45c-3.33,0.91-5.975,3.435-7.045,6.715c-1.065,3.28-0.405,6.88,1.75,9.57l27.215,33.93l-2.075,43.44 c-0.165,3.45,1.42,6.745,4.21,8.775c2.785,2.02,6.415,2.505,9.645,1.29l40.675-15.395l40.68,15.395 c1.175,0.445,2.405,0.665,3.625,0.665c2.13,0,4.245-0.665,6.02-1.955c2.79-2.03,4.375-5.325,4.21-8.775l-2.075-43.44l27.21-33.93 C163.745,233.231,164.405,229.631,163.34,226.351z M115.975,260.061c-1.56,1.945-2.355,4.4-2.24,6.895l1.515,31.725 l-29.705-11.245c-1.17-0.445-2.395-0.665-3.625-0.665c-1.23,0-2.455,0.22-3.625,0.665l-29.7,11.24l1.515-31.72 c0.12-2.495-0.68-4.95-2.24-6.895l-19.875-24.775l30.64-8.36c2.41-0.66,4.495-2.175,5.865-4.265l17.42-26.55l17.425,26.55 c1.37,2.09,3.455,3.605,5.865,4.265l30.635,8.36L115.975,260.061z"></path> </g> </g> <g> <g> <rect x="204.8" y="214.891" width="174.08" height="20.48"></rect> </g> </g> <g> <g> <rect x="204.8" y="266.091" width="286.72" height="20.48"></rect> </g> </g> <g> <g> <path d="M163.34,393.701c-1.07-3.28-3.715-5.805-7.045-6.715l-41.955-11.45l-23.86-36.365c-3.78-5.77-13.34-5.77-17.12,0 l-23.855,36.365l-41.96,11.45c-3.33,0.91-5.975,3.435-7.045,6.715c-1.065,3.28-0.405,6.88,1.75,9.57l27.215,33.93l-2.075,43.44 c-0.165,3.45,1.42,6.745,4.21,8.775c2.785,2.03,6.415,2.505,9.645,1.29l40.675-15.395l40.68,15.395 c1.175,0.445,2.405,0.665,3.625,0.665c2.13,0,4.245-0.665,6.02-1.955c2.79-2.03,4.375-5.325,4.21-8.775l-2.075-43.44l27.21-33.93 C163.745,400.581,164.405,396.981,163.34,393.701z M115.975,427.411c-1.56,1.945-2.355,4.4-2.24,6.895l1.515,31.725 l-29.705-11.245c-1.17-0.445-2.395-0.665-3.625-0.665c-1.23,0-2.455,0.22-3.625,0.665l-29.7,11.24l1.515-31.72 c0.12-2.495-0.68-4.95-2.24-6.895l-19.875-24.775l30.64-8.36c2.41-0.66,4.495-2.175,5.865-4.265l17.42-26.555l17.425,26.555 c1.37,2.09,3.455,3.605,5.865,4.265l30.635,8.36L115.975,427.411z"></path> </g> </g> <g> <g> <rect x="204.8" y="388.971" width="174.08" height="20.48"></rect> </g> </g> <g> <g> <rect x="204.8" y="440.171" width="286.72" height="20.48"></rect> </g> </g> </g></svg>
            ),
            camera: (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
            )
        };
        return icons[iconName] || icons.user;
    };

    const rankColors = {
        diamond: '#b9f2ff',
        platinum: '#D9D9D9',
        gold: '#EFBF04',
        silver: '#C4C4C4',
        bronze: '#CE8946',
        default: '#da2128'
    };

    const hangHoiVien = user?.hangHoiVien;
    let rawRank = '';

    if (typeof hangHoiVien === 'string' && hangHoiVien.length > 0) {
        rawRank = hangHoiVien;
    } else if (typeof hangHoiVien === 'object' && hangHoiVien !== null) {
        rawRank = hangHoiVien.tenHang || '';
    }

    const rankMapping = {
        'BRONZE': 'bronze',
        'SILVER': 'silver',
        'GOLD': 'gold',
        'PLATINUM': 'platinum',
        'DIAMOND': 'diamond'
    };

    const memberRank = rawRank && rankMapping[rawRank] ? rankMapping[rawRank] : 'default';
    const avatarBorderColor = rankColors[memberRank];

    const handleNavigate = (path) => {
        navigate(path);
        if (onClose) onClose();
    };

    const normalizePath = (p) => p ? p.replace(/\/$/, '') : '';

    const isActive = (path) => {
        const loc = normalizePath(location.pathname);
        const target = normalizePath(path);
        if (target === '/home' && (loc === '' || loc === '/')) return true;
        return loc === target;
    };

    return (
        <>
            {/* Overlay */}
            {isOpen && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
                    onClick={onClose}
                />
            )}

            {/* Sidebar */}
            <div className={`fixed top-16 pt-4 left-0 h-[calc(100vh-4rem)] ${collapsed ? 'w-20' : 'w-80'} bg-[#1a1a1a] border-r border-[#2a2a2a] transition-[width] duration-300 ease-in-out z-50 ${collapsed ? 'overflow-hidden' : 'overflow-y-auto'} sidebar-scroll ${isOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0 will-change-[width]`}>

                {/* Menu Items */}
                <nav className="flex-1">
                    <div className={`p-4 ${collapsed ? 'pt-4' : 'pt-4'}`}>
                        {menuItems.map((item, index) => (
                            <div key={item.id} className="relative mb-2">
                                <button
                                    onClick={() => handleNavigate(item.path)}
                                    title={item.label}
                                    className={`w-full flex items-center ${collapsed ? 'justify-center' : 'space-x-3'} px-4 py-3 ${collapsed ? 'text-center' : 'text-left'} text-gray-300 hover:text-white hover:bg-[#2a2a2a] rounded-lg transition-all duration-200 group ${isActive(item.path)
                                        ? 'bg-[#303030] border-l-4 border-[#da2128] text-white cursor-pointer'
                                        : 'bg-transparent border-l-4 border-transparent cursor-pointer'
                                        }`}
                                >
                                    <div className={`text-white group-hover:text-[#da2128] transition-colors ${isActive(item.path) ? 'text-[#da2128]' : ''
                                        }`}>
                                        {getIcon(item.icon)}
                                    </div>
                                    <div className="flex-1">
                                        <div className={`font-medium text-inherit group-hover:text-[#da2128] ${collapsed ? 'hidden' : ''}`}>{item.label}</div>
                                        <div className={`text-xs text-gray-400 group-hover:text-gray-400 ${collapsed ? 'hidden' : ''}`}>
                                            {item.description}
                                        </div>
                                    </div>
                                    {item.badge && (
                                        <div className="bg-[#da2128] text-white text-xs rounded-full px-2 py-1 min-w-[20px] text-center">
                                            {item.badge}
                                        </div>
                                    )}
                                </button>
                            </div>
                        ))}
                    </div>
                </nav>

            </div>

            {/* Collapse button*/}
            <button
                onClick={() => {
                    const next = !collapsed;
                    setCollapsed(next);
                    try {
                        window.dispatchEvent(new CustomEvent('sidebar:toggle', { detail: { collapsed: next } }));
                    } catch (e) { }
                }}
                title={collapsed ? 'Mở rộng' : 'Thu gọn'}
                className="hidden lg:flex fixed items-center justify-center w-12 h-12 text-white text-opacity-50 hover:text-opacity-100 hover:scale-110 transition-all duration-300 ease-out z-[200] cursor-pointer will-change-[left,transform]"
                style={{ left: collapsed ? '3.5rem' : '19rem', top: '5rem' }}
                aria-label={collapsed ? 'Mở rộng' : 'Thu gọn'}
            >
                <svg
                    width="24"
                    height="24"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    className={`transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`}
                >
                    <path d="M8.70710678,12 L19.5,12 C19.7761424,12 20,12.2238576 20,12.5 C20,12.7761424 19.7761424,13 19.5,13 L8.70710678,13 L11.8535534,16.1464466 C12.0488155,16.3417088 12.0488155,16.6582912 11.8535534,16.8535534 C11.6582912,17.0488155 11.3417088,17.0488155 11.1464466,16.8535534 L7.14644661,12.8535534 C6.95118446,12.6582912 6.95118446,12.3417088 7.14644661,12.1464466 L11.1464466,8.14644661 C11.3417088,7.95118446 11.6582912,7.95118446 11.8535534,8.14644661 C12.0488155,8.34170876 12.0488155,8.65829124 11.8535534,8.85355339 L8.70710678,12 L8.70710678,12 Z M4,5.5 C4,5.22385763 4.22385763,5 4.5,5 C4.77614237,5 5,5.22385763 5,5.5 L5,19.5 C5,19.7761424 4.77614237,20 4.5,20 C4.22385763,20 4,19.7761424 4,19.5 L4,5.5 Z" fill="currentColor" />
                </svg>
            </button>
        </>
    );
};

export default Sidebar;