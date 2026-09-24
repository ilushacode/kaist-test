import Loader from "../components/LoaderComponent"


export const LoaderScreen = () => {
  return (
    <div className="loader theme_light">
      <p className="loader__title">KAIST</p>

      <Loader color={'#e4eefe'} stroke={4} style={{position: 'absolute', bottom: '7rem', left: '50%', transform: 'translateX(-50%)'}} />
    </div>
  )
}