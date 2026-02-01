import "./page.css";

interface Props {
    params: Promise<{ id: string }>;
}

export default async function PDFViewer({ params }: Props) {
    const { id } = await params;

    return (
        <main style={{ padding: "1rem" }}>
            <div id="head">
                <h2>
                    <a href="/">return Home</a>
                </h2>
                <h2>
                    <a href="/archive">back to list</a>
                </h2>
            </div>
            <a
                href={`https://drive.google.com/uc?export=download&id=${id}`}
                target="_blank"
                rel="noopener noreferrer"
            >
                Download PDF
            </a>

            <iframe
                src={`https://drive.google.com/file/d/${id}/preview`}
                width="100%"
                height="900"
                style={{ border: "none", marginTop: "1rem" }}
            />
        </main>
    );
}
