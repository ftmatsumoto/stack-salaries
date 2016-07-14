class App extends React.Component {
  render() {
    return (
      <div>
        <Login/>
        <div>
          <Main/>
          <Search/>
          <Cloud/>
        </div>
      </div>
    )
  }
}

window.App = App;