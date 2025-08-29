import React from 'react';

function Info() {
    return (
        <>
            <div id="header-container"></div>
            <main>
                <section id="info">
                    {/* <p className="infobox" style={{whiteSpace: 'pre-wrap'}}>MANAGEMENT<br/><a href="mailto:info@futurebeat.co.uk"><em>info</em>@<em>futurebeat.co.uk</em></a></p> */}
                    <p className="infobox" style={{whiteSpace: 'pre-wrap'}}>INQUIRES<br/><a href="mailto:tanarouge@gmail.com"><em>tanarouge</em>@<em>gmail.com</em></a></p>
                    <p className="infobox" style={{whiteSpace: 'pre-wrap'}} aria-label="Booking email">BOOKING<br/><a href="mailto:oltredischi@gmail.com"><em>oltredischi</em>@<em>gmail.com</em></a></p>
                    <p className="infobox" style={{whiteSpace: 'pre-wrap'}}>&copy; Circle Thoughts Recordings</p>
                </section>
            </main>
        </>
    );
}

export default Info;
