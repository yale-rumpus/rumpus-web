import styles from "./SocialButtons.module.css";

export default function SocialButtons() {
    const socialLinks = [
        {
            id: 1,
            href: "https://www.instagram.com/yale.rumpus",
            className: styles.insta,
            icon: "fa-brands fa-instagram",
        },
        {
            id: 2,
            href: "https://x.com/YaleRumpus",
            className: styles.x,
            icon: "fa-brands fa-x-twitter",
        },
        {
            id: 3,
            href: "mailto:yalerumpus@gmail.com",
            className: styles.gmail,
            icon: "fa-solid fa-envelope",
        },
    ];

    return (
        <div className={styles.backdrop}>
            <ul className={styles.fixedSocials}>
                {socialLinks.map((link, index) => (
                    <li key={link.id} className={styles.li} style={{ animationDelay: `${index * 0.15}s` }}>
                        <a href={link.href} target="_blank" rel="noopener noreferrer" className={link.className}>
                            <i className={link.icon}></i>
                        </a>
                    </li>
                ))}
            </ul>
        </div>
    );
}
