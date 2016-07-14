class MainLayout extends {
  render() {
    return (
      <div>
        <main>
          {this.props.children}
        </main>
      </div>
    );
  }
}

window.MainLayout = MainLayout;