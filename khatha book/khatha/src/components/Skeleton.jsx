import React from 'react';
import './Skeleton.css';

const Skeleton = ({ width, height, borderRadius, className = '', style = {} }) => {
    const styles = {
        width,
        height,
        borderRadius,
        ...style,
    };

    return <div className={`skeleton ${className}`} style={styles}></div>;
};

export default Skeleton;
