import styles from "./SocialButtons.module.css";

export default function SocialButtons() {
    const socialLinks = [
        {
            id: 1,
            href: "https://www.instagram.com/yale.rumpus",
            brandClass: styles.insta,
            icon: "fa-brands fa-instagram",
        },
        {
            id: 2,
            href: "https://x.com/YaleRumpus",
            brandClass: styles.x,
            icon: "fa-brands fa-x-twitter",
        },
        {
            id: 3,
            href: "mailto:yalerumpus@gmail.com",
            brandClass: styles.gmail,
            // CHANGED: Uses the Google Brand icon instead of generic envelope
            icon: "fa-brands fa-google",
        },
    ];

    return (
        <div className={styles.backdrop}>
            <ul className={styles.fixedSocials}>
                {socialLinks.map((link, index) => (
                    <li key={link.id} className={styles.li} style={{ animationDelay: `${index * 0.1}s` }}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer">
                            {/* Layer 1: Grey Base Icon */}
                            <div className={styles.iconContainer}>
                                <i className={`${link.icon} ${styles.greyIcon}`}></i>
                            </div>

                            {/* Layer 2: Colored "Slideover" Icon */}
                            <div className={`${styles.mask} ${link.brandClass}`}>
                                <i className={`${link.icon} ${styles.coloredIcon}`}></i>
                            </div>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
