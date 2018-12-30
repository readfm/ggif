class URL{
  constructor(url){
    this.url = url;

    if(url.indexOf('://')){
      var proto = url.split('://');
      this.protocol = proto[0];
      this.path = proto[1];
      this.checkProtocol();
    }
  }

  checkProtocol(){
    if(protocol == 'dat' || protocol == 'ipfs'){
      var sep = this.path.indexOf('/');
      var hash = this.path.substr(0, sep),
          path = this.path.substr(sep+1);
    }

    if(protocol == 'dat'){
      this.dat = Dats.get(path);
    }
  }

  forDat(){
  }
}
