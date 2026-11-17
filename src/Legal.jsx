// Privacy, terms, credits, and the page for an address that does not exist.
import { useEffect } from 'react';
import { Link, Words, Rise, Arrow } from './lib.jsx';
import { Nav, Footer } from './components.jsx';
import { LEGAL, CREDITS } from './content.js';

const LINKS = [['Projects', '/#projects'], ['Locations', '/#map'], ['Building', '/#build'], ['Amenities', '/#amenities']];

export default function Legal({ kind }) {
  const title = kind === 'credits' ? 'Credits' : kind === 'missing' ? 'This page does not exist' : LEGAL[kind].title;
  useEffect(() => { document.title = `${title}: Tamala Homes, Guntur`; }, [title]);
  return (
    <>
      <Nav links={LINKS} solidAlways />
      <main id="main" className="doc">
        <div className="wrap">
          <Words as="h1" text={title} show />
          {kind === 'missing' && <Rise as="p" delay={0.2}><Link className="link" to="/">Go to the home page<Arrow /></Link></Rise>}
          {LEGAL[kind] && LEGAL[kind].blocks.map(([h, p], i) => (
            <Rise key={i} delay={0.1 + 0.06 * i}>{h && <h2>{h}</h2>}<p>{p}</p></Rise>
          ))}
          {kind === 'credits' && (
            <>
              <Rise as="p" delay={0.1}>The photographs and the film on this website come from Pexels and are used under the Pexels licence. They stand in until our own photographs of each project are ready.</Rise>
              <ul className="rows">
                {CREDITS.map(([what, type, id], i) => (
                  <Rise as="li" key={id} delay={Math.min(0.03 * i, 0.4)}><span>{what}</span><a className="link" href={`https://www.pexels.com/${type}/${id}/`} target="_blank" rel="noopener">Pexels {type} {id}</a></Rise>
                ))}
              </ul>
            </>
          )}
        </div>
      </main>
      <Footer />
    </>
  );
}
