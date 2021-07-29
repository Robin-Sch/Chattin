pkgname=chattin
_pkgname=chattin
pkgver=0.0.5
pkgrel=1
pkgdesc="An application to talk with other people across different rooms"
arch=('x86_64')
license=('AGPL3')
depends=('electron')
makedepends=('git' 'npm')
provides=('chattin')
conflicts=('chattin')
source=(git+https://github.com/Robin-floss/chattin)
sha256sums=(SKIP)

build() {
  cd "$srcdir/$_pkgname"
  npm install
  npm run build-pacman
}

package() {
  install -d "${pkgdir}"/{usr/bin,usr/lib/chattin}

  cd $_pkgname
  cp -R "./dist/linux-unpacked/resources/app.asar" "$pkgdir/usr/lib/$pkgname"
  install -Dm755 "./chattin.sh" "$pkgdir/usr/bin/chattin"
  install -Dm644 "./LICENSE" "$pkgdir/usr/share/licenses/$pkgname/LICENSE"
  install -Dm644 "./build/icon.png" "$pkgdir/usr/share/pixmaps/chattin.png"
  # install -Dm644 "./chattin.desktop" "$pkgdir/usr/share/applications/$pkgname.desktop"
}
