import { useEffect } from 'react';

function Info() {
  useEffect(() => {
    document.title = "Tanarouge — Info";
  }, []);

    return (
        <>
            <div id="header-container"></div>
            <main>
                <section id="home">
                    <img src="/assets/images/writing-camp.png" className="background-image" alt="Tanarouge" />
                    <div className="text-content">
                        <p className="description desktop-bio">
                            Venice-based artist and producer Tanarouge is in constant pursuit of connection between sound and emotion, human expression and nature. Shaped by electronic landscapes, ambient textures, and a fusion of countless influences, he crafts music that blends raw sonic elements, psychedelic atmospheres and immersive soundscapes of electronic music that aims at the heart, through the ribcage.
                            <br /><br />
                            For Tanarouge, each album is a timestamp: a reflection of a moment, an evolving snapshot of emotion and experience, never confined by genre or industry expectations. With an artistic vision rooted in creative freedom, he collaborates with musicians and creatives worldwide, leaving a distinctive sonic imprint across different projects.
                            <br /><br />
                            His music is an invitation to immerse, explore, let go of the unnecessary, and connect with the essence of sound.
                        </p>
                        <p className="description mobile-bio">
                            Venice-based artist and producer Tanarouge is in constant pursuit of connection—between sound and emotion, human expression and nature.
                        </p>
                    </div>
                </section>
                <section id="info">
                    {/* <p className="infobox" style={{whiteSpace: 'pre-wrap'}}>MANAGEMENT<br/><a href="mailto:info@futurebeat.co.uk"><em>info</em>@<em>futurebeat.co.uk</em></a></p> */}
                    <p className="infobox" style={{whiteSpace: 'pre-wrap'}}>INQUIRES / BOOKING<br/><a href="mailto:tanarouge@gmail.com"><em>tanarouge</em>@<em>gmail.com</em></a></p>
                    <p className="infobox copyright" style={{whiteSpace: 'pre-wrap'}}>&copy; Circle Thoughts Recordings</p>
                </section>
            </main>
        </>
    );
}

export default Info;
