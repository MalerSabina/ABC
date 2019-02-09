// calc.cc
#include <napi.h>
//#include <node.h>
#include <exception>

#if defined _WIN32
#include <windows.h>
#else
#include <unistd.h>
#endif

namespace calc {

Napi::Value EmptyCallback(const Napi::CallbackInfo& info)
{
    Napi::Env env = info.Env();
    Napi::HandleScope scope(env);

    return env.Undefined();
}

class CalcWorker : public Napi::AsyncWorker {

private:
    Napi::Promise::Deferred deferred;
    Napi::Object Result;
    const Napi::CallbackInfo& info;

public:
    CalcWorker(Napi::Function& callback, Napi::Promise::Deferred deferred, const Napi::CallbackInfo& cInfo)
    : Napi::AsyncWorker(callback), deferred(deferred), info(cInfo) {

        printf("Inside CalcWorker constructor\n");

    }
    ~CalcWorker() {}

    void Execute () {

        try {

            printf("Inside CalcWorker Execute\n");

            Napi::Env env = info.Env();

            const Napi::Array blocks = info[0].As<Napi::Array>();
            const Napi::Object INPUT = info[1].As<Napi::Object>();

            printf("Pointer %p\n", INPUT);

//        const Napi::Object INPUT_BLOCKS = INPUT["BLOCKS"].ToObject();
//        const Napi::Object INPUT_FILES = INPUT.Get("FILES").As<Napi::Object>();
//    //    printf("blocks length = %d\n", blocks.Length());
//
//        Napi::Object filesMap = Napi::Object::New(env);
//        int weight = 0;
//
//        for (int i = 0; i < (int)blocks.Length(); i++)
//        {
//            Napi::Number blockIndex = blocks.Get(i).ToNumber();
//    //        printf("blockIndex = %d\n", blockIndex.Int32Value());
//
//            const Napi::Object inputBlocksAtIndex = INPUT_BLOCKS[blockIndex].ToObject();
//            const Napi::Array filesForBlock = inputBlocksAtIndex["filesKeys"].As<Napi::Array>();
//
//            for (int j = 0; j < (int)filesForBlock.Length(); j++)
//            {
//                Napi::String fileIndex = filesForBlock[j].As<Napi::String>();
//                filesMap[fileIndex] = Napi::Boolean::New(env, true);
//            }
//        }
//
//
//        const Napi::Array files = filesMap.GetPropertyNames();
//        Napi::Object blocksInFiles = Napi::Object::New(env);
//        int filesLength = (int)files.Length();
//    //    printf("filesLength = %d\n", filesLength);
//
//        for (int i = 0; i < filesLength; i++)
//        {
//            const Napi::String file = files[i].ToString();
//            const Napi::Object fileObject = INPUT_FILES[file].ToObject();
//            const Napi::Array fileBlocks = fileObject["fileBlocks"].As<Napi::Array>();
//
//            int fileBlocksLength = (int)fileBlocks.Length();
//    //        printf("fileBlocksLength = %d\n", fileBlocksLength);
//            for (int j = 0; j < fileBlocksLength; j++)
//            {
//                // This operation is slow
//                const Napi::Object block = fileBlocks[j].ToObject();
//                const Napi::String blockIndex = block["blockIndex"].ToString();
//
//                if (blocksInFiles.Has(blockIndex) == false)
//                {
//                    Napi::Object blockObject = Napi::Object::New(env);
//                    blockObject[blockIndex] = blockIndex;
//                    blockObject["count"] = 1;
//                    blocksInFiles[blockIndex] = blockObject;
//                }
//                else
//                {
//                    Napi::Object blockObject = blocksInFiles.Get(blockIndex).As<Napi::Object>();
//                    blockObject["count"] = blockObject.Get("count").As<Napi::Number>().Int32Value () + 1;
//                }
//            }
//        }
//
//        const Napi::Array blocksInFilesKeys = blocksInFiles.GetPropertyNames();
//
//        for (int i = 0; i < (int)blocksInFilesKeys.Length(); i++)
//        {
//            const Napi::String blockIndex = blocksInFilesKeys[i].ToString();
//            const Napi::Object block = blocksInFiles.Get(blockIndex).As<Napi::Object>();
//            const int blockCount = block["count"].ToNumber().Int32Value();
//            const Napi::Object inputBlocksAtIndex = INPUT_BLOCKS[blockIndex].ToObject();
//            int filesBlockCount = inputBlocksAtIndex["filesKeys"].As<Napi::Array>().Length();
//
//            if (blockCount == filesBlockCount)
//            {
//                weight = inputBlocksAtIndex["blockWeight"].ToNumber().Int32Value() + weight;
//            }
//        }

        Result = Napi::Object::New(env);
//        Result["files"] = files;
//        Result["blocks"] = blocksInFilesKeys;
//        Result["weight"] = weight;

        }
        catch (std::exception e)
        {
            printf("Error: %s\n", e.what());
//            SetError(e.what());
        }

        printf("Inside CalcWorker Execute with Result\n");
    }

    void OnError() {
        Napi::HandleScope scope(Env());
        deferred.Reject(Napi::Error::New(Env(), "Something wrong").Value());

        // Call empty function
        Callback().Call({});
    }


    void OnOK() {
        printf("OnOK CalcWorker\n");

        Napi::HandleScope scope(Env());
        deferred.Resolve(Result);

        // Call empty function
        Callback().Call({});
    }


};

Napi::Object getFileInfoForBlocks(const Napi::CallbackInfo& info)
{
    printf("Inside getFileInfoForBlocks\n");

    Napi::Env env = info.Env();
//    Napi::EscapableHandleScope scope(env);

    auto deferred = Napi::Promise::Deferred::New(info.Env());
    printf("deferred created\n");

//    Napi::Function callback = Napi::Function::New(env, EmptyCallback);
//    printf("callback created\n");

//    CalcWorker* worker = new CalcWorker(callback, deferred, info);

    printf("CalcWorker created\n");
//
//    worker->Queue();
//
//    printf("Queue run\n");


    return deferred.Promise();
//    return scope.Escape(deferred.Promise()).ToObject();

//    const Napi::Array blocks = info[0].As<Napi::Array>();
//    const Napi::Object INPUT = info[1].As<Napi::Object>();


}


Napi::Object Init(Napi::Env env, Napi::Object exports)
{
    Napi::HandleScope scope(env);

    exports.Set(Napi::String::New(env, "getFileInfoForBlocks"),
              Napi::Function::New(env, getFileInfoForBlocks));
    return exports;
}

NODE_API_MODULE(calc, Init)

}  // namespace calc
