# sails-graphql-client

Very simple GraphQL client for sails app. Use it with [sails-graphql-adapter](https://github.com/arvitaly/sails-graphql-adapter)

[![Build Status](https://travis-ci.org/arvitaly/sails-graphql-client.svg?branch=master)](https://travis-ci.org/arvitaly/sails-graphql-client)
[![npm version](https://badge.fury.io/js/sails-graphql-client.svg)](https://badge.fury.io/js/sails-graphql-client)
[![Coverage Status](https://coveralls.io/repos/github/arvitaly/sails-graphql-client/badge.svg?branch=master)](https://coveralls.io/github/arvitaly/sails-graphql-client?branch=master)
[![unstable](http://badges.github.io/stability-badges/dist/unstable.svg)](http://github.com/badges/stability-badges)

# Install

    npm install sails-graphql-client --save

# API

    request(q, vars?): Promise<any>

    watchRequest(q, vars?, opts?: { pollingTimeout?: number }): IOneEmitter<any>

Watch request used [onemitter](https://github.com/arvitaly/onemitter)

# Example

## Create mutation

    await client.request(`
        mutation M1{ 
            createUser( input: {firstName: "Ni"} ){ 
                user{
                    id
                } 
            } 
        }`);
    // { createUser: {user: { id : 15 }} }

## Watch for query

    const handle = (data)=>{
        // {user:{firstName: "John" }}
    }
    client.watchRequest(`
        query Q1{ 
            user(
                firstNameContains:"Jo"
                ){ 
                    firstName 
                } 
            }`, {},{ pollingTimeout: 50 })(handle);



