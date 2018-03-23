using System;
using System.Collections.Generic;
using System.Linq;
using System.Web;
using Owin;
using Microsoft.Owin;

[assembly: OwinStartup(typeof(JWYPE.Startup))]
namespace JWYPE
{
    public class Startup
    {
        public void Configuration(IAppBuilder app)
        {
          
            // configure mapsignal
            app.MapSignalR();
        }
     }
}