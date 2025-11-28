'use client';

import { useState, useEffect } from 'react';


export default function Countdown({ targetDate }) {
    const [timeLeft, setTimeLeft] = useState({
        days: 0,
        hours: 0,
        minutes: 0,
        seconds: 0,
    });
    
    useEffect(() => {
        const calculateTimeLeft = () => {
            const target = new Date(targetDate).getTime();
            const now = new Date().getTime();
            const difference = target - now;
            
            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference / (1000 * 60 * 60)) % 24),
                    minutes: Math.floor((difference / 1000 / 60) % 60),
                    seconds: Math.floor((difference / 1000) % 60),
                });
            }
        };
        
        calculateTimeLeft();
        const timer = setInterval(calculateTimeLeft, 1000);
        
        return () => clearInterval(timer);
    }, [targetDate]);
    
    if (timeLeft.days == 0 && timeLeft.hours == 0 && timeLeft.minutes == 0 && timeLeft.seconds <= 10) {
        return (
            <>
            <div className="rumpus-countdown">
                <div className="countdown-item-final">
                <span className="countdown-value">{timeLeft.seconds}</span>
                <span className="countdown-label">S</span>
                </div>
            </div>
            </>
        );
    } else {
        return (
            <>
            <div className="rumpus-countdown">
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.days}</span>
                    <span className="countdown-label">D</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.hours}</span>
                    <span className="countdown-label">H</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.minutes}</span>
                    <span className="countdown-label">M</span>
                </div>
                <div className="countdown-item">
                    <span className="countdown-value">{timeLeft.seconds}</span>
                    <span className="countdown-label">S</span>
                </div>
            </div>
        </>
        );
    }
}