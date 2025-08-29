import { useEffect } from 'react';

function Live() {
  useEffect(() => {
    const script = document.createElement('script');
    script.src = 'https://widgetv3.bandsintown.com/main.min.js';
    script.charset = 'utf-8';
    script.async = true;
    document.body.appendChild(script);

    script.onload = () => {
      const widget = document.querySelector('.bit-widget-initializer');
      if (widget && window.Bandsintown?.loadWidget) {
        window.Bandsintown.loadWidget(widget);
      }
    };
  }, []);

  return (
    <div className="widget-container" style={{ maxWidth: '1200px', margin: '20px auto 0 auto', paddingLeft: '2%', paddingRight: '2%' }}>
      <a
        className="bit-widget-initializer"
        data-artist-name="id_15610204"
        data-events-to-display=""
        data-background-color="rgba(255,255,255,1)"
        data-separator-color="rgba(221,221,221,1)"
        data-text-color="rgba(66,66,66,1)"
        data-font="Helvetica"
        data-auto-style="true"
        data-button-label-capitalization="uppercase"
        data-header-capitalization="uppercase"
        data-location-capitalization="uppercase"
        data-venue-capitalization="uppercase"
        data-display-local-dates="true"
        data-local-dates-position="tab"
        data-display-past-dates="true"
        data-display-details="false"
        data-display-lineup="false"
        data-display-start-time="false"
        data-social-share-icon="false"
        data-display-limit="all"
        data-date-format="MMM. D, YYYY"
        data-date-orientation="horizontal"
        data-date-border-color="#4A4A4A"
        data-date-border-width="1px"
        data-date-capitalization="capitalize"
        data-date-border-radius="10px"
        data-event-ticket-cta-size="medium"
        data-event-custom-ticket-text=""
        data-event-ticket-text="TICKETS"
        data-event-ticket-icon="false"
        data-event-ticket-cta-text-color="rgba(255,255,255,1)"
        data-event-ticket-cta-bg-color="rgba(74,74,74,1)"
        data-event-ticket-cta-border-color="rgba(74,74,74,1)"
        data-event-ticket-cta-border-width="0px"
        data-event-ticket-cta-border-radius="2px"
        data-sold-out-button-text-color="rgba(255,255,255,1)"
        data-sold-out-button-background-color="rgba(74,74,74,1)"
        data-sold-out-button-border-color="rgba(74,74,74,1)"
        data-sold-out-button-clickable="true"
        data-event-rsvp-position="left"
        data-event-rsvp-cta-size="medium"
        data-event-rsvp-only-show-icon="false"
        data-event-rsvp-text="RSVP"
        data-event-rsvp-icon="false"
        data-event-rsvp-cta-text-color="rgba(74,74,74,1)"
        data-event-rsvp-cta-bg-color="rgba(255,255,255,1)"
        data-event-rsvp-cta-border-color="rgba(74,74,74,1)"
        data-event-rsvp-cta-border-width="1px"
        data-event-rsvp-cta-border-radius="2px"
        data-follow-section-position="top"
        data-follow-section-alignment="center"
        data-follow-section-header-text="Get updates on new shows, new music, and more"
        data-follow-section-cta-size="medium"
        data-follow-section-cta-text="FOLLOW"
        data-follow-section-cta-icon="false"
        data-follow-section-cta-text-color="rgba(255,255,255,1)"
        data-follow-section-cta-bg-color="rgba(74,74,74,1)"
        data-follow-section-cta-border-color="rgba(74,74,74,1)"
        data-follow-section-cta-border-width="0px"
        data-follow-section-cta-border-radius="2px"
        data-play-my-city-position="bottom"
        data-play-my-city-alignment="center"
        data-play-my-city-header-text="Don’t see a show near you?"
        data-play-my-city-cta-size="medium"
        data-play-my-city-cta-text="REQUEST A SHOW"
        data-play-my-city-cta-icon="false"
        data-play-my-city-cta-text-color="rgba(255,255,255,1)"
        data-play-my-city-cta-bg-color="rgba(74,74,74,1)"
        data-play-my-city-cta-border-color="rgba(74,74,74,1)"
        data-play-my-city-cta-border-width="0px"
        data-play-my-city-cta-border-radius="2px"
        data-optin-font=""
        data-optin-text-color=""
        data-optin-bg-color=""
        data-optin-cta-text-color=""
        data-optin-cta-bg-color=""
        data-optin-cta-border-width=""
        data-optin-cta-border-radius=""
        data-optin-cta-border-color=""
        data-language="en"
        data-layout-breakpoint="900"
        data-app-id=""
        data-affil-code=""
        data-bit-logo-position="hidden"
        data-bit-logo-color="rgba(66,66,66,1)"
      ></a>
    </div>
  );
}

export default Live;