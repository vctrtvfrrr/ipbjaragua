import { institutionalMetadata } from '@/lib/og/metadata'

export const metadata = institutionalMetadata('location')

export default function Location() {
  return (
    <>
      <div className="w-full overflow-hidden bg-gray-300">
        <iframe
          src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3571.3908258552988!2d-49.082858023701334!3d-26.475358375073966!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x94de95ab151cbda5%3A0x9a87aa2bae2e7a16!2sR.%20Gustavo%20Bruch%2C%2086%20-%20Czerniewicz%2C%20Jaragu%C3%A1%20do%20Sul%20-%20SC%2C%2089255-020!5e0!3m2!1sen!2sbr!4v1780840614671!5m2!1sen!2sbr"
          className="block h-96 w-full border-0 inset-shadow-sm"
          title="Localização"
          width="100%"
          height="384"
          style={{ border: 0 }}
          loading="lazy"
          allowFullScreen
          referrerPolicy="no-referrer-when-downgrade"
        />
      </div>

      <main className="container mx-auto px-4 py-10 xl:px-0">
        <p>
          Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Vestibulum
          tortor quam, feugiat vitae, ultricies eget, tempor sit amet, ante. Donec eu libero sit amet quam egestas
          semper. Aenean ultricies mi vitae est. Mauris placerat eleifend leo. Quisque sit amet est et sapien
          ullamcorper pharetra. Vestibulum erat wisi, condimentum sed, commodo vitae, ornare sit amet, wisi. Aenean
          fermentum, elit eget tincidunt condimentum, eros ipsum rutrum orci, sagittis tempus lacus enim ac dui. Donec
          non enim in turpis pulvinar facilisis. Ut felis. Praesent dapibus, neque id cursus faucibus, tortor neque
          egestas augue, eu vulputate magna eros eu erat. Aliquam erat volutpat. Nam dui mi, tincidunt quis, accumsan
          porttitor, facilisis luctus, metus
        </p>
        <ul>
          <li>Lorem ipsum dolor sit amet, consectetuer adipiscing elit.</li>
          <li>Aliquam tincidunt mauris eu risus.</li>
          <li>Vestibulum auctor dapibus neque.</li>
        </ul>
        <p>
          Ligula est ut, curae rhoncus ultrices mi non. Et viverra blandit, congue nullam, urna mollis potenti
          consectetur semper ad senectus. Pharetra condimentum, nulla conubia nostra cras. Condimentum velit euismod,
          eget ligula sem sodales bibendum. Aliquet vulputate dui congue, lacinia venenatis quisque, nec adipiscing
          suscipit ante ut accumsan bibendum lobortis. Convallis ante, torquent arcu justo.
        </p>
      </main>
    </>
  )
}
