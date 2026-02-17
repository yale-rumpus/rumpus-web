import "./archive.css";

import archive from "@/data/archive.json";
import Link from "next/link";

export default function Home() {
    return (
        <main style={{ padding: "2rem", maxWidth: 800 }} className="archive-main">
            <h1>PDF Archive</h1>

            {Object.entries(archive)
                .sort(([a], [b]) => Number(b) - Number(a))
                .map(([year, files]) => (
                    <section key={year} style={{ marginTop: "2rem" }} className="archive-main ">
                        <h2 className="archive-header">{year}</h2>
                        <ul className="issue-card">
                            {files.map((file: any) => (
                                <li key={file.id} className="linkto">
                                    <Link href={`/pdf/${file.id}`}>{file.title}</Link>
                                </li>
                            ))}
                        </ul>
                    </section>
                ))}
        </main>
    );
}
