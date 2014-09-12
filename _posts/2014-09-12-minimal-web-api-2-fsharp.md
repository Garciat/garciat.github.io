---
layout:     post
title:      Minimal Self-Hosted Web Api 2 Server in MonoDevelop F#
date:       2014-09-11 10:07
---

Time-appropriate greetings, reader!

First, fire up MonoDevelop and create a new **F# Library** solution.

(Note: you can probably do all this in Visual Studio with very few modifications, if any)

Let's call our solution: **HelloWorldApi**

You can go ahead and delete `Component1.fs` and `Script.fsx`.

Make sure the project you just created targets the .NET 4.5 Framework.

Install `Microsoft.AspNet.WebApi.Owin` via NuGet Packages.

Create a new empty class called `HomeController` with the following code:

{% highlight fsharp %}
namespace HelloWorldApi

open System
open System.Web.Http

type HomeController() = 
    inherit ApiController()

    [<HttpGet>]
    [<Route("hello")>]
    member this.Hello() =
        "Hello World!"
{% endhighlight %}

This creates a new route accessible via `/hello` that will output a JSON-encoded
string containing "Hello World!".

Create an empty class `Startup` with:

{% highlight fsharp %}
namespace HelloWorldApi

open Owin

open System
open System.Web.Http

type Startup() = 
    member this.Configuration(app : IAppBuilder) = 
        let apiConfig = new HttpConfiguration()
        apiConfig.MapHttpAttributeRoutes()
        app.UseWebApi(apiConfig) |> ignore
{% endhighlight %}

This tells the OWIN IAppBuilder we want to use Web Api 2 along with HTTP attribute routes.

Now, we need to create an executable to host our api.

Create a **F# Console Application** project within the solution called `HelloWorldApi.Host`
and add a reference to our previous `HelloWorldApi` library project.

(Remember: .NET 4.5!)

Note: in case MonoDevelop complains about not being able to find HelloWorldApi.dll,
compile the solution once and then simply close and re-open it.

This time we can keep the default `Program.fs`.

Install `Microsoft.Owin.Hosting` and `Microsoft.Owin.Host.HttpListener` via NuGet Packages.

Modify `Program.fs`:

{% highlight fsharp %}
open System

open Owin
open Microsoft.Owin.Hosting

open HelloWorldApi

[<EntryPoint>]
let main argv = 
    let url = "http://127.0.0.1:8000"
    use server = WebApp.Start<Startup>(url)
    printfn "Running on %s" url
    printfn "Press enter to exit"
    Console.ReadLine() |> ignore
    0
{% endhighlight %}

That's it! Compile and run the solution and then point your browser
(or [Postman](https://chrome.google.com/webstore/detail/postman-rest-client-packa/fhbjgbiflinjbdggehcddcbncdddomop))
to [127.0.0.1:8000/hello](127.0.0.1:8000/hello). You should see:


    "Hello World!"

(This is a JSON string. That's why it's surrounded by quotes.)

That's all folks! See you next time.

Final note: you can find the code on [GitHub](https://github.com/Garciat/HelloWorldApiFsharp).
